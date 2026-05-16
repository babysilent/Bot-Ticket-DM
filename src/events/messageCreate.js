import db from '../utils/base_de_donnees.js';
import { ChannelType } from 'discord.js';
import * as serviceTickets from '../utils/serviceTickets.js';
import * as permissions from '../utils/permissions.js';

export async function gestionMessages(message) {
    if (message.author.bot) return;

    if (message.channel.type === ChannelType.GuildText) {
        const ticket = serviceTickets.recupTicketParSalon(message.channel.id);
        if (ticket) {
            // Mise à jour de l'activité
            db.prepare('UPDATE tickets SET last_activity = CURRENT_TIMESTAMP WHERE channel_id = ?').run(message.channel.id);

            const estMembreStaff = permissions.estStaff(message.member);

            // On enregistre le temps de la première réponse du staff
            if (estMembreStaff && !ticket.first_response_at && ticket.user_id !== message.author.id) {
                db.prepare('UPDATE tickets SET first_response_at = CURRENT_TIMESTAMP WHERE ticket_id = ?').run(ticket.ticket_id);
            }

            // Auto-revendication si c'est du staff qui parle et que personne n'a pris le ticket
            if (!ticket.claimed_by && estMembreStaff && ticket.user_id !== message.author.id) {
                await serviceTickets.prendreTicket(ticket.ticket_id, message.author.id);
                await message.channel.send({ 
                    content: `👋 <@${message.author.id}>, tu as répondu en premier, le ticket t'a été automatiquement attribué !` 
                });
            }

            // Relais inverse : Staff -> DM de l'utilisateur (si c'est un ticket DM)
            if (ticket.is_dm && estMembreStaff) {
                const utilisateur = await message.client.users.fetch(ticket.user_id).catch(() => null);
                if (utilisateur) {
                    await utilisateur.send({
                        content: `**[Réponse du Staff]**: ${message.content}`,
                        files: message.attachments.map(a => a.url)
                    }).catch(() => {
                        message.channel.send("⚠️ Impossible d'envoyer le message en DM (utilisateur probablement bloqué).");
                    });
                }
            }
        }
    }

    if (message.channel.type === ChannelType.DM) {
        const ticket = db.prepare('SELECT * FROM tickets WHERE user_id = ? AND is_dm = 1 AND status = "open"').get(message.author.id);
        
        if (ticket) {
            if (ticket.channel_id) {
                const serveur = message.client.guilds.cache.get(process.env.GUILD_ID);
                const salon = await serveur.channels.fetch(ticket.channel_id).catch(() => null);
                if (salon) {
                    await salon.send(`**[DM de <@${message.author.id}>]**: ${message.content}`);
                }
            }
        } else {
            await message.reply('Tu n\'as pas de ticket ouvert en ce moment. Utilise `/ticket` sur le serveur pour en ouvrir un.');
        }
    }
}
