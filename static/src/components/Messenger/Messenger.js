/** @odoo-module **/
import { Component, useState, onWillStart, onMounted, useRef, useEffect } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { session } from "@web/session";

export class Messenger extends Component {
    static template = "mini_messenger.Messenger";

    setup() {
        this.orm = useService("orm");
        
        // Bus and Notification might not be available in all environments (e.g. some portal setups)
        // We handle them defensively
        try {
            this.busService = useService("bus_service");
        } catch (e) {
            console.warn("Bus service not available");
        }
        
        try {
            this.notification = useService("notification");
        } catch (e) {
            console.warn("Notification service not available");
        }

        this.state = useState({
            conversations: [],
            activeConversationId: null,
            messages: [],
            newMessage: "",
            searchQuery: "",
            suggestedPartners: [],
            showNewChatModal: false,
        });

        this.messageListRef = useRef("messageList");

        onWillStart(async () => {
            await this.loadConversations();
        });

        onMounted(() => {
            if (this.busService) {
                const partnerId = session.partner_id || (odoo.session_info && odoo.session_info.partner_id);
                if (partnerId) {
                    const channel = `messenger_${partnerId}`;
                    this.busService.addChannel(channel);
                    console.log("MiniMessenger: Subscribed to channel:", channel);
                }

                this.busService.subscribe((notifications) => {
                    console.log("MiniMessenger: Bus update received", notifications);
                    for (const { type, payload } of notifications) {
                        if (type === "new_message") {
                            console.log("MiniMessenger: New Message received!", payload);
                            this.handleNewMessage(payload);
                        }
                    }
                });
            } else {
                console.error("MiniMessenger: Bus Service not found!");
            }
        });

        useEffect(() => {
            this.scrollToBottom();
        }, () => [this.state.messages.length, this.state.activeConversationId]);
    }

    async loadConversations() {
        try {
            const convs = await this.orm.call("mini_messenger.conversation", "get_user_conversations", []);
            this.state.conversations = convs;
            console.log("MiniMessenger: Loaded Conversations", convs);
        } catch (e) {
            console.error("MiniMessenger: Failed to load conversations", e);
        }
    }

    async selectConversation(id) {
        this.state.activeConversationId = id;
        try {
            const messages = await this.orm.call("mini_messenger.conversation", "get_messages", [[id]]);
            this.state.messages = messages;
            console.log("MiniMessenger: Loaded Messages", messages);
        } catch (e) {
            console.error("MiniMessenger: Failed to load messages", e);
        }
    }

    get activeConversation() {
        return this.state.conversations.find(c => c.id === this.state.activeConversationId);
    }

    get filteredConversations() {
        if (!this.state.searchQuery) return this.state.conversations;
        const query = this.state.searchQuery.toLowerCase();
        return this.state.conversations.filter(c => c.name.toLowerCase().includes(query));
    }

    async startNewChat() {
        try {
            const partners = await this.orm.call("mini_messenger.conversation", "get_suggested_partners", []);
            this.state.suggestedPartners = partners;
            this.state.showNewChatModal = true;
        } catch (e) {
            console.error("MiniMessenger: Failed to load suggested partners", e);
        }
    }

    async createNew1to1(partnerId) {
        try {
            const convId = await this.orm.call("mini_messenger.conversation", "find_or_create_1to1", [partnerId]);
            this.state.showNewChatModal = false;
            await this.loadConversations();
            this.selectConversation(convId);
        } catch (e) {
            console.error("MiniMessenger: Failed to create conversation", e);
        }
    }

    async sendMessage() {
        if (!this.state.newMessage.trim() || !this.state.activeConversationId) return;
        
        const body = this.state.newMessage;
        this.state.newMessage = "";

        try {
            // Append message locally for immediate feedback (optimistic UI)
            const tempId = `temp_${Date.now()}`;
            const partnerId = session.partner_id || (odoo.session_info && odoo.session_info.partner_id);
            const partnerName = session.name || (odoo.session_info && odoo.session_info.name) || "Me";
            
            const tempMsg = {
                id: tempId,
                body: body,
                author_id: [partnerId, partnerName],
                conversation_id: this.state.activeConversationId,
                create_date: new Date().toISOString(),
                isTemp: true,
            };
            this.state.messages.push(tempMsg);

            await this.orm.create("mini_messenger.message", [{
                conversation_id: this.state.activeConversationId,
                body: body,
            }]);
        } catch (e) {
            console.error("MiniMessenger: Failed to send message", e);
            if (this.notification) {
                this.notification.add("Failed to send message", { type: "danger" });
            }
        }
    }

    handleNewMessage(payload) {
        // Check if message already exists
        const exists = this.state.messages.find(m => m.id === payload.id || (m.isTemp && m.body === payload.body));
        
        if (exists) {
            if (exists.isTemp) {
                Object.assign(exists, payload, { isTemp: false });
            }
            return;
        }

        if (payload.conversation_id === this.state.activeConversationId) {
            this.state.messages.push(payload);
        }
        
        const conv = this.state.conversations.find(c => c.id === payload.conversation_id);
        if (conv) {
            conv.lastMessage = payload.body;
        } else {
            this.loadConversations();
        }
    }

    onInputKeyDown(ev) {
        if (ev.key === "Enter" && !ev.shiftKey) {
            ev.preventDefault();
            this.sendMessage();
        }
    }

    isMine(msg) {
        const partnerId = session.partner_id || (odoo.session_info && odoo.session_info.partner_id);
        return msg.author_id[0] === partnerId;
    }

    formatTime(dateStr) {
        if (!dateStr) return "";
        try {
            let date;
            if (dateStr.includes('T')) {
                // Local ISO string from optimistic UI
                date = new Date(dateStr);
            } else {
                // Odoo server string (YYYY-MM-DD HH:MM:SS)
                // We add 'Z' after replacing space with 'T' to ensure it's treated as UTC
                date = new Date(dateStr.replace(' ', 'T') + 'Z');
            }
            
            if (isNaN(date.getTime())) {
                // Final fallback
                date = new Date(dateStr);
            }

            if (isNaN(date.getTime())) return "??:??";
            
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            console.error("Date parsing error", e, dateStr);
            return "??:??";
        }
    }

    scrollToBottom() {
        const list = this.messageListRef.el;
        if (list) {
            list.scrollTop = list.scrollHeight;
        }
    }
}

registry.category("actions").add("mini_messenger.MessengerAction", Messenger);
