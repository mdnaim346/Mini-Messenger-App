# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request

class MessengerController(http.Controller):

    @http.route(['/my/messenger'], type='http', auth="user", website=True)
    def messenger_portal(self, **kw):
        """ Render the messenger in the portal """
        return request.render("mini_messenger.portal_messenger_layout")
