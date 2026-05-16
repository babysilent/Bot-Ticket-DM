import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import * as serviceTickets from '../utils/serviceTickets.js';
import * as embeds from '../utils/embeds.js';
import * as permissions from '../utils/permissions.js';
import { logAction } from '../utils/journal.js';

export default {
    async execute(interaction) {
        const { commandName, options, channel, user, member } = interaction;
        const ticket = serviceTickets.recupTicketParSalon(channel.id);

        if (!ticket) {
            return interaction.reply({ content: 'Cette commande ne fonctionne que dans un salon de ticket !', ephemeral: true });
        }

        if (!permissions.peutGererTicket(member, ticket)) {
            return interaction.reply({ content: 'T\'as pas les droits pour faire ça, désolé.', ephemeral: true });
        }

        switch (commandName) {
            case 'delete':
                const confirmRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`confirmer_suppression_${ticket.ticket_id}`)
                        .setLabel('Confirmer la suppression')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🗑️'),
                    new ButtonBuilder()
                        .setCustomId('annuler_suppression')
                        .setLabel('Annuler')
                        .setStyle(ButtonStyle.Secondary)
                );

                await interaction.reply({ 
                    content: '⚠️ **Attention :** Tu es sur le point de supprimer ce salon définitivement. Es-tu sûr ?',
                    components: [confirmRow]
                });
                break;

            case 'close':
                const raison = options.getString('raison') || 'Pas de raison spécifiée';
                await interaction.reply({ content: `On ferme le ticket : ${raison}` });
                await serviceTickets.fermerTicket(ticket.ticket_id, raison, user.id);
                break;

            case 'reopen':
                if (ticket.status === 'open') {
                    return interaction.reply({ content: 'Le ticket est déjà ouvert !', ephemeral: true });
                }
                await serviceTickets.reouvrirTicket(ticket.ticket_id);
                await interaction.reply({ content: '🔓 Le ticket a été réouvert !' });
                await logAction(client, { name: 'Ticket Réouvert', color: embeds.couleurs.succes }, { ticket, staff: user.id });
                break;

            case 'claim':
                await serviceTickets.prendreTicket(ticket.ticket_id, user.id);
                await interaction.reply({ content: `<@${user.id}> a pris le ticket !` });
                break;

            case 'priority':
                const niveau = options.getString('niveau');
                await serviceTickets.changerPriorite(ticket.ticket_id, niveau);
                await interaction.reply({ content: `Priorité passée à : **${niveau}**` });
                break;

            case 'note':
                const texte = options.getString('contenu');
                await serviceTickets.ajouterNote(ticket.ticket_id, user.id, texte);
                await interaction.reply({ content: 'Note enregistrée !', ephemeral: true });
                break;
            
            case 'add-user':
                const membreAajouter = options.getUser('membre');
                await channel.permissionOverwrites.edit(membreAajouter.id, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true
                });
                await interaction.reply({ content: `<@${membreAajouter.id}> a été ajouté au ticket.` });
                break;

            case 'remove-user':
                const membreAretirer = options.getUser('membre');
                await channel.permissionOverwrites.delete(membreAretirer.id);
                await interaction.reply({ content: `<@${membreAretirer.id}> a été retiré du ticket.` });
                break;

            case 'rename':
                const nouveauNom = options.getString('nom');
                await channel.setName(nouveauNom);
                await interaction.reply({ content: `Le salon s'appelle maintenant : **${nouveauNom}**` });
                break;
        }
    }
};
