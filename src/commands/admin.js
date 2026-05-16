import { EmbedBuilder } from 'discord.js';
import * as embeds from '../utils/embeds.js';
import * as permissions from '../utils/permissions.js';
import * as serviceTickets from '../utils/serviceTickets.js';
import db from '../utils/base_de_donnees.js';

export default {
    async execute(interaction) {
        if (!permissions.estAdmin(interaction.member)) {
            return interaction.reply({ content: 'Désolé, mais faut être admin pour ça.', ephemeral: true });
        }

        const { commandName, options, guild } = interaction;
        const sousCommande = options.getSubcommand(false);

        if (commandName === 'panel') {
            const salon = options.getChannel('salon') || interaction.channel;
            const embed = embeds.creerEmbedPanel();
            const boutons = embeds.creerBoutonsPanel();
            await salon.send({ embeds: [embed], components: boutons });
            await interaction.reply({ content: 'Panel envoyé !', ephemeral: true });
        }

        if (commandName === 'blacklist') {
            const membre = options.getUser('membre');
            if (sousCommande === 'ajouter') {
                const raison = options.getString('raison') || 'Pas de raison';
                db.prepare('INSERT OR REPLACE INTO blacklist (user_id, reason, staff_id) VALUES (?, ?, ?)').run(membre.id, raison, interaction.user.id);
                await interaction.reply({ content: `<@${membre.id}> est maintenant banni du support. Raison : ${raison}` });
            } else if (sousCommande === 'retirer') {
                db.prepare('DELETE FROM blacklist WHERE user_id = ?').run(membre.id);
                await interaction.reply({ content: `<@${membre.id}> n'est plus banni.` });
            } else if (sousCommande === 'liste') {
                const liste = db.prepare('SELECT * FROM blacklist').all();
                const embed = new EmbedBuilder().setTitle('Membres bannis').setColor(embeds.couleurs.erreur);
                if (liste.length === 0) embed.setDescription('Personne n\'est banni pour le moment.');
                else embed.setDescription(liste.map(b => `<@${b.user_id}> - ${b.reason}`).join('\n'));
                await interaction.reply({ embeds: [embed] });
            }
        }

        if (commandName === 'canned') {
            if (sousCommande === 'ajouter') {
                const nom = options.getString('nom');
                const texte = options.getString('contenu');
                db.prepare('INSERT OR REPLACE INTO canned_responses (name, content, created_by) VALUES (?, ?, ?)').run(nom, texte, interaction.user.id);
                await interaction.reply({ content: `Réponse \`${nom}\` ajoutée !` });
            } else if (sousCommande === 'supprimer') {
                const nom = options.getString('nom');
                db.prepare('DELETE FROM canned_responses WHERE name = ?').run(nom);
                await interaction.reply({ content: `Réponse \`${nom}\` supprimée.` });
            } else if (sousCommande === 'liste') {
                const liste = db.prepare('SELECT * FROM canned_responses').all();
                const embed = new EmbedBuilder().setTitle('Réponses automatiques').setColor(embeds.couleurs.info);
                if (liste.length === 0) embed.setDescription('Aucune réponse enregistrée.');
                else embed.setDescription(liste.map(c => `**${c.name}**: ${c.content.substring(0, 50)}...`).join('\n'));
                await interaction.reply({ embeds: [embed] });
            } else if (sousCommande === 'utiliser') {
                const nom = options.getString('nom');
                const rep = db.prepare('SELECT * FROM canned_responses WHERE name = ?').get(nom);
                if (!rep) return interaction.reply({ content: 'Réponse introuvable...', ephemeral: true });
                
                // On remplace les variables par les vraies infos
                let contenuFinal = rep.content
                    .replace(/{user}/g, `<@${interaction.channel.topic?.split(' - ')[1] || 'Utilisateur'}>`) // On essaie de choper l'ID si c'est un salon ticket
                    .replace(/{staff}/g, `<@${interaction.user.id}>`)
                    .replace(/{serveur}/g, interaction.guild.name);

                // Si on est dans un ticket, on essaie de choper l'auteur du ticket via la DB
                const ticket = serviceTickets.recupTicketParSalon(interaction.channel.id);
                if (ticket) {
                    contenuFinal = contenuFinal.replace(/{user}/g, `<@${ticket.user_id}>`);
                }

                await interaction.channel.send(contenuFinal);
                await interaction.reply({ content: 'Réponse envoyée !', ephemeral: true });
            }
        }

        // Statistiques
        if (commandName === 'stats') {
            if (sousCommande === 'serveur') {
                const total = db.prepare('SELECT COUNT(*) as total FROM tickets').get().total;
                const ouverts = db.prepare('SELECT COUNT(*) as total FROM tickets WHERE status = "open"').get().total;
                const fermes = db.prepare('SELECT COUNT(*) as total FROM tickets WHERE status = "closed"').get().total;
                
                // Calcul du temps de réponse moyen (en minutes)
                const tempsReponse = db.prepare(`
                    SELECT AVG((julianday(first_response_at) - julianday(created_at)) * 1440) as moyenne 
                    FROM tickets 
                    WHERE first_response_at IS NOT NULL
                `).get().moyenne;

                const embed = new EmbedBuilder()
                    .setTitle('📊 Stats du Serveur')
                    .addFields(
                        { name: 'Total tickets', value: `\`${total}\``, inline: true },
                        { name: 'Ouverts', value: `\`${ouverts}\``, inline: true },
                        { name: 'Fermés', value: `\`${fermes}\``, inline: true },
                        { name: 'Temps de réponse moyen', value: tempsReponse ? `\`${Math.round(tempsReponse)} minutes\`` : '`N/A`', inline: true }
                    )
                    .setColor(embeds.couleurs.info);
                await interaction.reply({ embeds: [embed] });
            } else if (sousCommande === 'staff') {
                const topStaff = db.prepare(`
                    SELECT claimed_by, COUNT(*) as total 
                    FROM tickets 
                    WHERE claimed_by IS NOT NULL 
                    GROUP BY claimed_by 
                    ORDER BY total DESC 
                    LIMIT 10
                `).all();

                const embed = new EmbedBuilder()
                    .setTitle('🏆 Classement du Staff')
                    .setColor(embeds.couleurs.succes)
                    .setDescription(
                        topStaff.length > 0 
                        ? topStaff.map((s, i) => `${i + 1}. <@${s.claimed_by}> - **${s.total}** tickets pris en charge`).join('\n')
                        : "Aucune donnée disponible pour le moment."
                    );
                await interaction.reply({ embeds: [embed] });
            } else if (sousCommande === 'membre') {
                const membre = options.getUser('membre');
                const statsMembre = db.prepare('SELECT COUNT(*) as total FROM tickets WHERE user_id = ?').get(membre.id).total;
                const ticketsOuverts = db.prepare('SELECT COUNT(*) as total FROM tickets WHERE user_id = ? AND status = "open"').get(membre.id).total;
                
                const embed = new EmbedBuilder()
                    .setTitle(`👤 Stats de ${membre.username}`)
                    .addFields(
                        { name: 'Total de tickets ouverts', value: `\`${statsMembre}\``, inline: true },
                        { name: 'Tickets actuellement ouverts', value: `\`${ticketsOuverts}\``, inline: true }
                    )
                    .setColor(embeds.couleurs.info);
                await interaction.reply({ embeds: [embed] });
            }
        }
    }
};
