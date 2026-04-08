# Real-time Mini Messenger for Odoo 17

This project implements a full-featured, real-time chatting interface within Odoo, mimicking the aesthetics and functionality of WhatsApp.

## 🏗️ Architecture Overview

The system consists of three main layers:
1.  **Data Layer (Backend)**: Custom Odoo models for Conversations and Messages.
2.  **Real-time Layer (Odoo Bus)**: Uses the `bus.bus` service to push instant notifications to clients when new messages arrive.
3.  **UI Layer (OWL Frontend)**: A modern, responsive dashboard built with the Odoo Web Library (OWL).

## 🗄️ Backend Models

### mini_messenger.conversation
- Groups members (partners) into a chat session.
- Allows for 1-to-1 or group chats.

### mini_messenger.message
- Stores individual chat bubbles.
- **Real-time Trigger**: Overrides `create()` to automatically dispatch a notification to all conversation members via `bus.bus` on a unique channel per partner (`mini_messenger_partner_{id}`).

## ⚡ Real-time Synchronization
- **Publish**: When a message is saved, the server sends a JSON payload to the recipient's personal bus channel.
- **Subscribe**: The Javascript component listens to this channel. When a "new_message" event is detected, the UI instantly appends the bubble without a page refresh.

## 🎨 Frontend Design
- **Layout**: Two-column layout with a scrollable conversation list on the left and an active chat window on the right.
- **Aesthetics**: Premium WhatsApp-inspired design with green/white chat bubbles, user avatars, and subtle shadows.
- **Interactions**: Enter-to-send, auto-scrolling to the latest message, and real-time conversation list updates.

## 🚀 How to Use
1.  **Install** the `mini_messenger` module.
2.  **Navigate** to the "Mini Messenger" menu in the Odoo backend.
3.  **Chat**: Create a conversation record in the backend first (adding yourself and another partner), then open the Messenger interface to start chatting in real-time.

---
### 🛠️ Technical Details
- **Module Name**: `mini_messenger`
- **Dependencies**: `base`, `web`, `bus`, `mail`
- **JS Action**: `mini_messenger.MessengerAction`
