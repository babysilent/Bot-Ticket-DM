import cron from 'node-cron';
import db from '../utils/base_de_donnees.js';
import dotenv from 'dotenv';

dotenv.config();

export function setupFermetureAuto(client) {
    cron.schedule('0 * * * *', async () => {
        console.log('Vérification des tickets inactifs...');
        const heuresAutoClose = parseInt(process.env.AUTO_CLOSE_HOURS) || 48;
        const heuresAutoDelete = parseInt(process.env.AUTO_DELETE_HOURS) || 72;

        const ticketsInactifs = db.prepare(`
            SELECT * FROM tickets 
            WHERE status = 'open' 
            AND datetime(last_activity, '+' || ? || ' hours') < datetime('now')
        `).all(heuresAutoClose);

        for (const t of ticketsInactifs) {
            db.prepare('UPDATE tickets SET status = "closed", closed_at = CURRENT_TIMESTAMP WHERE ticket_id = ?').run(t.ticket_id);
            const serveur = client.guilds.cache.get(process.env.GUILD_ID);
            if (t.channel_id) {
                const salon = await serveur.channels.fetch(t.channel_id).catch(() => null);
                if (salon) {
                    await salon.send(`Ce ticket a été fermé automatiquement car il n'y a pas eu d'activité depuis ${heuresAutoClose} heures.`);
                }
            }
        }

        const ticketsASupprimer = db.prepare(`
            SELECT * FROM tickets 
            WHERE status = 'closed' 
            AND datetime(closed_at, '+' || ? || ' hours') < datetime('now')
        `).all(heuresAutoDelete);

        for (const t of ticketsASupprimer) {
            const serveur = client.guilds.cache.get(process.env.GUILD_ID);
            if (t.channel_id) {
                const salon = await serveur.channels.fetch(t.channel_id).catch(() => null);
                if (salon) {
                    await salon.delete().catch(() => null);
                }
            }
            db.prepare('DELETE FROM tickets WHERE ticket_id = ?').run(t.ticket_id);
        }
    });
}
