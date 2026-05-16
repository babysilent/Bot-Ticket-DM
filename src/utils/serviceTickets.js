import base_de_donnees from './base_de_donnees.js';
import { ChannelType, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

export async function ouvrirTicket(serveur, auteur, infos) {
    const { categorie, sujet, description, viaDM } = infos;
    
    const ticketsActifs = base_de_donnees.prepare('SELECT COUNT(*) as total FROM tickets WHERE user_id = ? AND status = "open"').get(auteur.id);
    if (ticketsActifs.total >= (parseInt(process.env.MAX_TICKETS_PER_USER) || 3)) {
        throw new Error('Tu as déjà trop de tickets ouverts !');
    }

    const idTicket = `ticket-${Math.random().toString(36).substr(2, 9)}`;
    
    let salon;
    if (!viaDM) {
        salon = await serveur.channels.create({
            name: `${categorie.toLowerCase().replace(/ /g, '-')}-${auteur.username}`,
            type: ChannelType.GuildText,
            parent: process.env.TICKET_CATEGORY_ID,
            permissionOverwrites: [
                {
                    id: serveur.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: auteur.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                },
                {
                    id: process.env.MOD_ROLE_ID,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                },
            ],
        });
    }

    base_de_donnees.prepare(`
        INSERT INTO tickets (ticket_id, user_id, channel_id, category, subject, description, is_dm)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(idTicket, auteur.id, salon?.id || null, categorie, sujet, description, viaDM ? 1 : 0);

    return { idTicket, salon };
}

export async function fermerTicket(idTicket, raison, idStaff) {
    const ticket = base_de_donnees.prepare('SELECT * FROM tickets WHERE ticket_id = ?').get(idTicket);
    if (!ticket) throw new Error('Ticket introuvable...');

    base_de_donnees.prepare('UPDATE tickets SET status = "closed", closed_at = CURRENT_TIMESTAMP WHERE ticket_id = ?').run(idTicket);
    
    return ticket;
}

export async function reouvrirTicket(idTicket) {
    const ticket = base_de_donnees.prepare('SELECT * FROM tickets WHERE ticket_id = ?').get(idTicket);
    if (!ticket) throw new Error('Ticket introuvable...');

    base_de_donnees.prepare('UPDATE tickets SET status = "open", closed_at = NULL WHERE ticket_id = ?').run(idTicket);
    return ticket;
}

export async function prendreTicket(idTicket, idStaff) {
    base_de_donnees.prepare('UPDATE tickets SET claimed_by = ? WHERE ticket_id = ?').run(idStaff, idTicket);
}

export async function changerPriorite(idTicket, priorite) {
    base_de_donnees.prepare('UPDATE tickets SET priority = ? WHERE ticket_id = ?').run(priorite, idTicket);
}

export async function ajouterNote(idTicket, idStaff, contenu) {
    base_de_donnees.prepare('INSERT INTO staff_notes (ticket_id, staff_id, content) VALUES (?, ?, ?)').run(idTicket, idStaff, contenu);
}

export function recupTicketParSalon(idSalon) {
    return base_de_donnees.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(idSalon);
}

export function recupTicketParId(idTicket) {
    return base_de_donnees.prepare('SELECT * FROM tickets WHERE ticket_id = ?').get(idTicket);
}

export function estBanni(idUtilisateur) {
    const banni = base_de_donnees.prepare('SELECT * FROM blacklist WHERE user_id = ?').get(idUtilisateur);
    return !!banni;
}
