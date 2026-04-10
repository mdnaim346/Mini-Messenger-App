# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
import logging

_logger = logging.getLogger(__name__)

class MiniMessengerMessage(models.Model):
    _name = 'mini_messenger.message'
    _description = 'Messenger Message'
    _order = 'create_date asc'

    conversation_id = fields.Many2one('mini_messenger.conversation', string='Conversation', required=True, ondelete='cascade')
    author_id = fields.Many2one('res.partner', string='Author', default=lambda self: self.env.user.partner_id)
    body = fields.Text(string='Message Body', required=True)
    
    @api.model_create_multi
    def create(self, vals_list):
        messages = super(MiniMessengerMessage, self).create(vals_list)
        for message in messages:
            self._notify_message(message)
        return messages

    def _notify_message(self, message):
        """ Notify all conversation members via Bus using simple string channels """
        payload = {
            'id': message.id,
            'body': message.body,
            'author_id': [message.author_id.id, message.author_id.name],
            'conversation_id': message.conversation_id.id,
            'create_date': fields.Datetime.to_string(message.create_date),
        }
        
        for partner in message.conversation_id.member_ids:
            channel = f"messenger_{partner.id}"
            self.env['bus.bus']._sendone(channel, 'new_message', payload)
            
        _logger.info("Sent notifications for message %s to %s", message.id, message.conversation_id.member_ids.mapped('name'))
