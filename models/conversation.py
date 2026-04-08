# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class MiniMessengerConversation(models.Model):
    _name = 'mini_messenger.conversation'
    _description = 'Messenger Conversation'

    name = fields.Char(string='Name')
    member_ids = fields.Many2many('res.partner', string='Members')
    message_ids = fields.One2many('mini_messenger.message', 'conversation_id', string='Messages')
    
    @api.model
    def get_user_conversations(self):
        """ Get all conversations for the current user """
        partner_id = self.env.user.partner_id.id
        conversations = self.search([('member_ids', 'in', partner_id)])
        return conversations.read(['id', 'name', 'member_ids'])

    @api.model
    def find_or_create_1to1(self, partner_id):
        """ Find or create a 1-to-1 conversation with another partner """
        my_partner = self.env.user.partner_id
        other_partner = self.env['res.partner'].browse(partner_id)
        
        domain = [
            ('member_ids', 'in', my_partner.id),
            ('member_ids', 'in', other_partner.id),
        ]
        convs = self.search(domain)
        # Filter for exact 1-to-1 match (only 2 members)
        conv = convs.filtered(lambda c: len(c.member_ids) == 2)
        
        if not conv:
            conv = self.create({
                'name': f"{my_partner.name}, {other_partner.name}",
                'member_ids': [(6, 0, [my_partner.id, other_partner.id])]
            })
        
        return conv.id

    @api.model
    def get_suggested_partners(self):
        """ Get partners that the user might want to chat with """
        # Returns 10 partners that are users and not the current user
        return self.env['res.partner'].search([
            ('user_ids', '!=', False),
            ('id', '!=', self.env.user.partner_id.id)
        ], limit=10).read(['id', 'name'])
