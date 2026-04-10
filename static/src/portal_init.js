/** @odoo-module **/
import publicWidget from "@web/legacy/js/public/public_widget";
import { mount } from "@odoo/owl";
import { Messenger } from "./components/Messenger/Messenger";
import { templates } from "@web/core/assets";

publicWidget.registry.MiniMessenger = publicWidget.Widget.extend({
    selector: "#messenger_root",
    async start() {
        // In Odoo 17, publicWidget.container already has the correct odoo environment (env)
        // this.container.env includes all services like rpc, orm, bus_service, etc.
        await mount(Messenger, this.el, {
            name: "Mini Messenger",
            env: this.container.env,
            templates,
        });
        return this._super(...arguments);
    },
});
