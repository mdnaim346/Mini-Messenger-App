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
        """ Get all conversations for the current user with dynamic names for 1-to-1 chats """
        my_partner = self.env.user.partner_id
        conversations = self.search([('member_ids', 'in', my_partner.id)])
        
        res = []
        for conv in conversations:
            # For 1-to-1 chats, always show the other person's name
            display_name = conv.name
            if len(conv.member_ids) == 2:
                other_member = conv.member_ids.filtered(lambda p: p.id != my_partner.id)
                if other_member:
                    display_name = other_member[0].name
            
            res.append({
                'id': conv.id,
                'name': display_name,
                'member_ids': conv.member_ids.ids,
            })
        return res

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
                'name': other_partner.name,
                'member_ids': [(6, 0, [my_partner.id, other_partner.id])]
            })
        
        return conv.id

    @api.model
    def get_suggested_partners(self):
        """ Get partners that the user might want to chat with """
        return self.env['res.partner'].search([
            ('user_ids', '!=', False),
            ('id', '!=', self.env.user.partner_id.id)
        ], limit=10).read(['id', 'name'])

    def get_messages(self, limit=50, offset=0):
        """ Get messages for this conversation """
        self.ensure_one()
        messages = self.env['mini_messenger.message'].search([
            ('conversation_id', '=', self.id)
        ], limit=limit, offset=offset, order='create_date desc')
        
        # We return them in ascending order for the UI
        return [{
            'id': m.id,
            'body': m.body,
            'author_id': [m.author_id.id, m.author_id.name],
            'create_date': fields.Datetime.to_string(m.create_date)
        } for m in reversed(messages)]
