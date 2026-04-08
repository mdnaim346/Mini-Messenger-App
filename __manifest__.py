# -*- coding: utf-8 -*-
{
    'name': 'Mini Messenger',
    'version': '1.0',
    'category': 'Communication',
    'summary': 'Real-time WhatsApp-like Chatting Module',
    'description': """
        A real-time chatting interface for Odoo users using OWL and Odoo Bus.
    """,
    'author': 'Antigravity',
    'depends': ['base', 'web', 'bus', 'mail', 'portal'],
    'data': [
        'security/ir.model.access.csv',
        'views/mini_messenger_views.xml',
        'views/mini_messenger_menus.xml',
        'views/mini_messenger_portal_templates.xml',
        'views/mini_messenger_portal_menus.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'mini_messenger/static/src/components/*/*.js',
            'mini_messenger/static/src/components/*/*.xml',
            'mini_messenger/static/src/components/*/*.scss',
        ],
        'web.assets_frontend': [
            'mini_messenger/static/src/components/*/*.js',
            'mini_messenger/static/src/components/*/*.xml',
            'mini_messenger/static/src/components/*/*.scss',
            'mini_messenger/static/src/portal_init.js',
        ],
    },
    'installable': True,
    'application': True,
}
