import { 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    EmbedBuilder, 
    AttachmentBuilder, 
    StringSelectMenuBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} from 'discord.js';
import * as serviceTickets from '../utils/serviceTickets.js';
import * as embeds from '../utils/embeds.js';
import * as permissions from '../utils/permissions.js';
import { logAction } from '../utils/journal.js';
import db from '../utils/base_de_donnees.js';

export async function gestionInteractions(interaction) {
    if (interaction.isButton()) {
        await gestionBoutons(interaction);
    } else if (interaction.isModalSubmit()) {
        await gestionModales(interaction);
    } else if (interaction.isStringSelectMenu()) {
        await gestionMenus(interaction);
    }
}

async function gestionBoutons(interaction) {
    const { customId, user, guild, channel, client, member } = interaction;

    if (customId.startsWith('ouvrir_')) {
        if (serviceTickets.estBanni(user.id)) {
            return interaction.reply({ content: 'Désolé, mais tu es banni du support.', ephemeral: true });
        }

        const categorieCle = customId.split('_')[1];
        const nomsCategories = {
            bug: 'Bug Report',
            feature: 'Feature Request',
            general: 'Support Général',
            collab: 'Collaboration',
            testing: 'Mod Testing',
            staff: 'Rapport Staff'
        };

        const modale = new ModalBuilder()
            .setCustomId(`modale_ouvrir_${categorieCle}`)
            .setTitle(`Formulaire ${nomsCategories[categorieCle]}`);

        const inputSujet = new TextInputBuilder()
            .setCustomId('sujet')
            .setLabel('Sujet du ticket')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Résume ton problème en quelques mots')
            .setRequired(true);

        const inputDesc = new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Détails')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Explique-nous tout ici...')
            .setRequired(true);

        modale.addComponents(
            new ActionRowBuilder().addComponents(inputSujet),
            new ActionRowBuilder().addComponents(inputDesc)
        );

        if (categorieCle === 'bug') {
            const inputVersion = new TextInputBuilder()
                .setCustomId('version')
                .setLabel('Version (Mod/Jeu)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('ex: FS25 v1.0')
                .setRequired(true);
            modale.addComponents(new ActionRowBuilder().addComponents(inputVersion));
        }

        await interaction.showModal(modale);
        return;
    }

    const ticket = serviceTickets.recupTicketParSalon(channel.id);
    if (!ticket) return;

    if (!permissions.peutGererTicket(member, ticket)) {
        return interaction.reply({ content: 'Oula, tu n\'as pas le droit de toucher à ça !', ephemeral: true });
    }

    if (customId.startsWith('confirmer_suppression_')) {
        await interaction.reply({ content: 'Suppression du salon en cours...' });
        setTimeout(async () => {
            await channel.delete().catch(() => null);
        }, 2000);
        return;
    }

    switch (customId) {
        case 'annuler_suppression':
            await interaction.update({ content: 'Suppression annulée.', components: [] });
            break;

        case 'ticket_fermer':
            const menuFeedback = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`feedback_${ticket.ticket_id}`)
                    .setPlaceholder('Comment s\'est passé le support ?')
                    .addOptions([
                        { label: '⭐⭐⭐⭐⭐ Excellent', value: '5' },
                        { label: '⭐⭐⭐⭐ Très bon', value: '4' },
                        { label: '⭐⭐⭐ Correct', value: '3' },
                        { label: '⭐⭐ Bof', value: '2' },
                        { label: '⭐ Mauvais', value: '1' },
                    ])
            );

            await interaction.reply({ content: 'Je ferme le ticket...' });
            
            // Génération du transcript avant fermeture pour archivage
            const messages = await channel.messages.fetch({ limit: 100 });
            const bufferTranscript = await embeds.genererTranscript(messages, ticket);
            const fichierTranscript = new AttachmentBuilder(bufferTranscript, { name: `transcript-${ticket.ticket_id}.html` });

            await serviceTickets.fermerTicket(ticket.ticket_id, 'Bouton fermer', user.id);
            
            const auteurTicket = await client.users.fetch(ticket.user_id).catch(() => null);
            if (auteurTicket) {
                await auteurTicket.send({ 
                    content: `Ton ticket **${ticket.subject}** a été fermé. Voici le transcript de vos échanges.`,
                    files: [fichierTranscript],
                    components: [menuFeedback]
                }).catch(() => null);
            }

            await logAction(client, { name: 'Ticket Fermé & Archivé', color: embeds.couleurs.erreur }, { 
                ticket, 
                staff: user.id,
                extra: { Archive: "Envoyée dans ce canal et en DM à l'utilisateur" }
            });
            
            // On envoie aussi le transcript dans le salon de log pour les admins
            const salonLogs = await client.channels.fetch(process.env.LOG_CHANNEL_ID).catch(() => null);
            if (salonLogs) {
                await salonLogs.send({ 
                    content: `📁 Archive du ticket **${ticket.ticket_id}** (${ticket.subject})`,
                    files: [fichierTranscript] 
                });
            }

            await channel.send('Ticket fermé ! Le salon sera supprimé automatiquement selon la configuration.');
            break;

        case 'ticket_saisir':
            await serviceTickets.prendreTicket(ticket.ticket_id, user.id);
            const embedPris = embeds.creerEmbedTicket({ ...ticket, claimed_by: user.id });
            await interaction.update({ embeds: [embedPris] });
            await channel.send(`<@${user.id}> s'occupe de vous !`);
            await logAction(client, { name: 'Ticket Revendiqué', color: embeds.couleurs.succes }, { ticket, staff: user.id });
            break;

        case 'ticket_priorite':
            const menuPriorite = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`priorite_${ticket.ticket_id}`)
                    .setPlaceholder('Changer la priorité')
                    .addOptions([
                        { label: '🟢 Basse', value: 'Low' },
                        { label: '🔵 Normale', value: 'Normal' },
                        { label: '🟡 Haute', value: 'High' },
                        { label: '🔴 Critique', value: 'Critical' },
                    ])
            );
            await interaction.reply({ components: [menuPriorite], ephemeral: true });
            break;

        case 'ticket_transcript':
            const msgs = await channel.messages.fetch({ limit: 100 });
            const buffer = await embeds.genererTranscript(msgs, ticket);
            const fichier = new AttachmentBuilder(buffer, { name: `transcript-${ticket.ticket_id}.html` });
            await interaction.reply({ files: [fichier] });
            await logAction(client, { name: 'Transcript Généré', color: embeds.couleurs.info }, { ticket, staff: user.id });
            break;

        case 'ticket_note':
            const modaleNote = new ModalBuilder()
                .setCustomId(`modale_note_${ticket.ticket_id}`)
                .setTitle('📝 Ajouter une Note');
            
            const inputNote = new TextInputBuilder()
                .setCustomId('contenu')
                .setLabel('Note interne (staff uniquement)')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Écris ta note ici...')
                .setRequired(true);
            
            modaleNote.addComponents(new ActionRowBuilder().addComponents(inputNote));
            await interaction.showModal(modaleNote);
            break;

        case 'ticket_tag':
            const modaleTag = new ModalBuilder()
                .setCustomId(`modale_tag_${ticket.ticket_id}`)
                .setTitle('🏷️ Gérer les Tags');
            
            const inputTag = new TextInputBuilder()
                .setCustomId('tags')
                .setLabel('Tags (séparés par des virgules)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('ex: Urgent, Bug, Modding')
                .setDefaultValue(ticket.tags || '')
                .setRequired(true);
            
            modaleTag.addComponents(new ActionRowBuilder().addComponents(inputTag));
            await interaction.showModal(modaleTag);
            break;

        case 'ticket_renommer':
            const modaleRename = new ModalBuilder()
                .setCustomId(`modale_rename_${ticket.ticket_id}`)
                .setTitle('✏️ Renommer le Salon');
            
            const inputRename = new TextInputBuilder()
                .setCustomId('nouveau_nom')
                .setLabel('Nouveau nom du salon')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('ex: bug-fs25-urgent')
                .setDefaultValue(channel.name)
                .setRequired(true);
            
            modaleRename.addComponents(new ActionRowBuilder().addComponents(inputRename));
            await interaction.showModal(modaleRename);
            break;

        case 'ticket_infos':
            const notes = db.prepare('SELECT * FROM staff_notes WHERE ticket_id = ?').all(ticket.ticket_id);
            const infoEmbed = new EmbedBuilder()
                .setTitle('Informations du Ticket')
                .addFields(
                    { name: 'ID', value: `\`${ticket.ticket_id}\``, inline: true },
                    { name: 'Proprio', value: `<@${ticket.user_id}>`, inline: true },
                    { name: 'Catégorie', value: `\`${ticket.category}\``, inline: true },
                    { name: 'Priorité', value: ticket.priority, inline: true },
                    { name: 'Staff', value: ticket.claimed_by ? `<@${ticket.claimed_by}>` : 'Personne', inline: true },
                    { name: 'Date', value: new Date(ticket.created_at).toLocaleString(), inline: true }
                )
                .setColor(embeds.couleurs.info);

            if (notes.length > 0) {
                infoEmbed.addFields({ 
                    name: '📝 Notes Staff', 
                    value: notes.map(n => `• **<@${n.staff_id}>** : ${n.content} *(le ${new Date(n.timestamp).toLocaleDateString()})*`).join('\n')
                });
            }

            await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
            break;

        case 'mod_liste_ouverts':
            const ticketsOuverts = db.prepare('SELECT * FROM tickets WHERE status = "open"').all();
            const embedOuverts = new EmbedBuilder().setTitle('Tickets Ouverts').setColor(embeds.couleurs.info);
            if (ticketsOuverts.length === 0) embedOuverts.setDescription('Aucun ticket ouvert.');
            else embedOuverts.setDescription(ticketsOuverts.map(t => `**${t.ticket_id}** - <@${t.user_id}> (${t.category})`).join('\n'));
            await interaction.reply({ embeds: [embedOuverts], ephemeral: true });
            break;

        case 'mod_liste_non_assignes':
            const nonAssignes = db.prepare('SELECT * FROM tickets WHERE status = "open" AND claimed_by IS NULL').all();
            const embedNonAssignes = new EmbedBuilder().setTitle('Tickets Non Assignés').setColor(embeds.couleurs.alerte);
            if (nonAssignes.length === 0) embedNonAssignes.setDescription('Tout est pris en charge !');
            else embedNonAssignes.setDescription(nonAssignes.map(t => `**${t.ticket_id}** - <@${t.user_id}> (${t.category})`).join('\n'));
            await interaction.reply({ embeds: [embedNonAssignes], ephemeral: true });
            break;

        case 'mod_stats':
            const totalStats = db.prepare('SELECT COUNT(*) as total FROM tickets').get().total;
            const embedStats = new EmbedBuilder()
                .setTitle('Stats Globales')
                .setDescription(`On a traité un total de **${totalStats}** tickets depuis le début.`)
                .setColor(embeds.couleurs.info);
            await interaction.reply({ embeds: [embedStats], ephemeral: true });
            break;
    }
}

async function gestionMenus(interaction) {
    const { customId, values, user, client } = interaction;

    if (customId.startsWith('priorite_')) {
        const idTicket = customId.split('_')[1];
        const p = values[0];
        await serviceTickets.changerPriorite(idTicket, p);
        const t = serviceTickets.recupTicketParId(idTicket);
        await interaction.reply({ content: `Priorité changée en : **${p}**`, ephemeral: true });
        await logAction(client, { name: 'Priorité Modifiée', color: embeds.couleurs.alerte }, { ticket: t, staff: user.id, extra: { Nouvelle: p } });
    }

    if (customId.startsWith('feedback_')) {
        const note = values[0];
        await interaction.reply({ content: `Merci pour ta note de ${note}/5 ! Ça nous aide beaucoup.`, ephemeral: true });
        await logAction(client, { name: 'Feedback Reçu', color: embeds.couleurs.succes }, { extra: { Note: `${note}/5` }, user: user.id });
    }
}

async function gestionModales(interaction) {
    const { customId, user, guild, fields, client, channel } = interaction;

    if (customId.startsWith('modale_tag_')) {
        const idTicket = customId.split('_')[2];
        const tags = fields.getTextInputValue('tags');
        db.prepare('UPDATE tickets SET tags = ? WHERE ticket_id = ?').run(tags, idTicket);
        await interaction.reply({ content: `Tags mis à jour : \`${tags}\``, ephemeral: true });
        
        // On rafraîchit l'embed du ticket si possible
        const ticket = serviceTickets.recupTicketParId(idTicket);
        if (ticket && channel) {
            const embed = embeds.creerEmbedTicket(ticket);
            // On essaie de trouver le message d'origine (celui avec les boutons)
            const msgs = await channel.messages.fetch({ limit: 50 });
            const msgOriginal = msgs.find(m => m.author.id === client.user.id && m.embeds.length > 0);
            if (msgOriginal) {
                await msgOriginal.edit({ embeds: [embed] });
            }
        }
    }

    if (customId.startsWith('modale_rename_')) {
        const idTicket = customId.split('_')[2];
        const nouveauNom = fields.getTextInputValue('nouveau_nom');
        await channel.setName(nouveauNom);
        await interaction.reply({ content: `Salon renommé en : **${nouveauNom}**`, ephemeral: true });
    }

    if (customId.startsWith('modale_note_')) {
        const idTicket = customId.split('_')[2];
        const contenu = fields.getTextInputValue('contenu');
        await serviceTickets.ajouterNote(idTicket, user.id, contenu);
        await interaction.reply({ content: 'Note ajoutée !', ephemeral: true });
        await logAction(client, { name: 'Note Staff Ajoutée', color: embeds.couleurs.alerte }, { ticket: { ticket_id: idTicket }, staff: user.id, reason: contenu });
    }

    if (customId.startsWith('modale_ouvrir_')) {
        let nomCat;
        let dm = false;

        const cleCat = customId.split('_')[2];
        const mapping = {
            bug: 'Bug Report',
            feature: 'Feature Request',
            general: 'Support Général',
            collab: 'Collaboration',
            testing: 'Mod Testing',
            staff: 'Rapport Staff'
        };
        nomCat = mapping[cleCat];
        dm = cleCat === 'staff';

        const sujet = fields.getTextInputValue('sujet');
        const desc = fields.getTextInputValue('description');
        const version = cleCat === 'bug' ? fields.getTextInputValue('version') : null;

        try {
            await interaction.deferReply({ ephemeral: true });
            const { idTicket, salon } = await serviceTickets.ouvrirTicket(guild, user, {
                categorie: nomCat,
                sujet,
                description: desc,
                viaDM: dm
            });

            if (salon) {
                const dataTicket = {
                    ticket_id: idTicket,
                    user_id: user.id,
                    category: nomCat,
                    priority: 'Normal',
                    subject: sujet,
                    description: version ? `${desc}\n\n**Version:** ${version}` : desc
                };

                const embed = embeds.creerEmbedTicket(dataTicket);
                const boutons = embeds.creerLigneActions();
                
                let messageBienvenue = `Nouveau ticket de <@${user.id}> | <@&${process.env.MOD_ROLE_ID}>`;
                const conseilsCategories = {
                    'Bug Report': "💡 **Conseil :** N'oubliez pas de joindre vos fichiers `log.txt` si nécessaire.",
                    'Feature Request': "💡 **Conseil :** Soyez le plus précis possible sur l'utilité de votre idée.",
                    'Mod Testing': "🧪 **Testeurs :** Merci de suivre le protocole de test habituel.",
                    'Rapport Staff': "🛡️ **Confidentialité :** Ce ticket est privé et traité par la haute administration."
                };

                const conseil = conseilsCategories[nomCat] || "Un membre du staff va vous répondre sous peu.";

                await salon.send({ 
                    content: messageBienvenue, 
                    embeds: [embed], 
                    components: boutons 
                });

                await salon.send({ content: conseil });

                await interaction.editReply({ content: `Ton ticket est ouvert ici : <#${salon.id}>` });
                await logAction(client, { name: 'Ticket Ouvert', color: embeds.couleurs.primaire }, { ticket: dataTicket, user: user.id });
            } else {
                await interaction.editReply({ content: `Ticket ouvert ! On continue en DM.` });
            }
        } catch (err) {
            await interaction.editReply({ content: `Erreur : ${err.message}` });
        }
    }
}
