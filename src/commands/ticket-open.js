import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import * as serviceTickets from '../utils/serviceTickets.js';

export default {
    name: 'ticket',
    async execute(interaction) {
        if (serviceTickets.estBanni(interaction.user.id)) {
            return interaction.reply({ content: 'Désolé, mais tu es banni du système de tickets.', ephemeral: true });
        }

        const categorie = interaction.options.getString('categorie') || 'Support Général';
        const viaDM = interaction.options.getBoolean('dm') || false;

        const modale = new ModalBuilder()
            .setCustomId(`modale_ouvrir_manuelle_${categorie.replace(/ /g, '_')}_${viaDM}`)
            .setTitle(`Support : ${categorie}`);

        const inputSujet = new TextInputBuilder()
            .setCustomId('sujet')
            .setLabel('Sujet')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('De quoi s\'agit-il ?')
            .setRequired(true);

        const inputDesc = new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Description')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Détaille ton problème au maximum...')
            .setRequired(true);

        modale.addComponents(
            new ActionRowBuilder().addComponents(inputSujet),
            new ActionRowBuilder().addComponents(inputDesc)
        );

        await interaction.showModal(modale);
    }
};
