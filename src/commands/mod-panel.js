import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import db from '../utils/base_de_donnees.js';
import * as embeds from '../utils/embeds.js';
import * as permissions from '../utils/permissions.js';

export default {
    async execute(interaction) {
        if (!permissions.estStaff(interaction.member)) {
            return interaction.reply({ content: 'Seul le staff peut voir ça.', ephemeral: true });
        }

        const ouverts = db.prepare('SELECT COUNT(*) as total FROM tickets WHERE status = "open"').get().total;
        const nonAssignes = db.prepare('SELECT COUNT(*) as total FROM tickets WHERE status = "open" AND claimed_by IS NULL').get().total;
        const fermesAujourdhui = db.prepare('SELECT COUNT(*) as total FROM tickets WHERE status = "closed" AND date(closed_at) = date("now")').get().total;

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Dashboard de Modération')
            .setDescription('Petit coup d\'œil sur ce qui se passe au support.')
            .addFields(
                { name: '🎫 Tickets Ouverts', value: `\`${ouverts}\``, inline: true },
                { name: '⏳ Non assignés', value: `\`${nonAssignes}\``, inline: true },
                { name: '✅ Fermés aujourd\'hui', value: `\`${fermesAujourdhui}\``, inline: true }
            )
            .setColor(embeds.couleurs.primaire)
            .setFooter({ text: 'FS25 Modding Support' })
            .setTimestamp();

        const boutons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('mod_liste_ouverts').setLabel('Liste Ouverts').setStyle(ButtonStyle.Primary).setEmoji('📂'),
            new ButtonBuilder().setCustomId('mod_liste_non_assignes').setLabel('Non assignés').setStyle(ButtonStyle.Secondary).setEmoji('⏳'),
            new ButtonBuilder().setCustomId('mod_stats').setLabel('Statistiques').setStyle(ButtonStyle.Secondary).setEmoji('📊')
        );

        await interaction.reply({ embeds: [embed], components: [boutons] });
    }
};
