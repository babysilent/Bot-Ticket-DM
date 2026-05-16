import { EmbedBuilder } from 'discord.js';
import { couleurs } from './embeds.js';
import dotenv from 'dotenv';

dotenv.config();

export async function logAction(client, action, details) {
    const idSalonLog = action.estAdmin ? process.env.ADMIN_LOG_CHANNEL_ID : process.env.LOG_CHANNEL_ID;
    if (!idSalonLog) return;

    const salon = await client.channels.fetch(idSalonLog).catch(() => null);
    if (!salon) return;

    const embed = new EmbedBuilder()
        .setTitle(`🛠️ Log : ${action.name}`)
        .setColor(action.color || couleurs.info)
        .setTimestamp();

    if (details.ticket) {
        embed.addFields({ name: '🎫 Ticket', value: `\`${details.ticket.ticket_id}\``, inline: true });
    }
    
    if (details.staff) {
        embed.addFields({ name: '👮 Staff', value: `<@${details.staff}>`, inline: true });
    }

    if (details.user) {
        embed.addFields({ name: '👤 Utilisateur', value: `<@${details.user}>`, inline: true });
    }

    if (details.reason) {
        embed.addFields({ name: '📝 Raison', value: details.reason });
    }

    if (details.extra) {
        Object.entries(details.extra).forEach(([cle, valeur]) => {
            embed.addFields({ name: cle, value: String(valeur), inline: true });
        });
    }

    await salon.send({ embeds: [embed] });
}
