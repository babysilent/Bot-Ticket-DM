import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const commandes = [
    new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Ouvrir un ticket de support')
        .addStringOption(opt =>
            opt.setName('categorie')
                .setDescription('La catégorie du ticket')
                .addChoices(
                    { name: 'Bug Report', value: 'Bug Report' },
                    { name: 'Feature Request', value: 'Feature Request' },
                    { name: 'Support Général', value: 'Support Général' },
                    { name: 'Collaboration', value: 'Collaboration' },
                    { name: 'Mod Testing', value: 'Mod Testing' },
                    { name: 'Rapport Staff', value: 'Rapport Staff' }
                ))
        .addBooleanOption(opt =>
            opt.setName('dm')
                .setDescription('Gérer le ticket par message privé')),

    new SlashCommandBuilder()
        .setName('close')
        .setDescription('Fermer le ticket actuel')
        .addStringOption(opt => opt.setName('raison').setDescription('Pourquoi on ferme le ticket ?')),

    new SlashCommandBuilder()
        .setName('reopen')
        .setDescription('Réouvrir un ticket fermé'),

    new SlashCommandBuilder()
        .setName('delete')
        .setDescription('Supprimer définitivement le ticket'),

    new SlashCommandBuilder()
        .setName('claim')
        .setDescription('Prendre en charge le ticket'),

    new SlashCommandBuilder()
        .setName('unclaim')
        .setDescription('Relâcher le ticket'),

    new SlashCommandBuilder()
        .setName('priority')
        .setDescription('Changer la priorité du ticket')
        .addStringOption(opt =>
            opt.setName('niveau')
                .setDescription('Niveau de priorité')
                .setRequired(true)
                .addChoices(
                    { name: 'Basse', value: 'Low' },
                    { name: 'Normale', value: 'Normal' },
                    { name: 'Haute', value: 'High' },
                    { name: 'Critique', value: 'Critical' }
                )),

    new SlashCommandBuilder()
        .setName('add-user')
        .setDescription('Ajouter un membre au ticket')
        .addUserOption(opt => opt.setName('membre').setDescription('Qui ajouter ?').setRequired(true)),

    new SlashCommandBuilder()
        .setName('remove-user')
        .setDescription('Retirer un membre du ticket')
        .addUserOption(opt => opt.setName('membre').setDescription('Qui retirer ?').setRequired(true)),

    new SlashCommandBuilder()
        .setName('rename')
        .setDescription('Renommer le salon du ticket')
        .addStringOption(opt => opt.setName('nom').setDescription('Nouveau nom').setRequired(true)),

    new SlashCommandBuilder()
        .setName('note')
        .setDescription('Ajouter une note interne (staff uniquement)')
        .addStringOption(opt => opt.setName('contenu').setDescription('Le texte de la note').setRequired(true)),

    new SlashCommandBuilder()
        .setName('transcript')
        .setDescription('Générer le transcript HTML'),

    new SlashCommandBuilder()
        .setName('ticket-info')
        .setDescription('Voir les détails du ticket'),

    new SlashCommandBuilder()
        .setName('modpanel')
        .setDescription('Ouvrir le dashboard modo'),

    new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Envoyer le panel de tickets')
        .addChannelOption(opt => opt.setName('salon').setDescription('Dans quel salon ?')),

    new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Gérer la liste noire')
        .addSubcommand(sub =>
            sub.setName('ajouter').setDescription('Bannir quelqu\'un du support')
                .addUserOption(opt => opt.setName('membre').setDescription('Le membre').setRequired(true))
                .addStringOption(opt => opt.setName('raison').setDescription('Pourquoi ?')))
        .addSubcommand(sub =>
            sub.setName('retirer').setDescription('Débannir quelqu\'un')
                .addUserOption(opt => opt.setName('membre').setDescription('Le membre').setRequired(true)))
        .addSubcommand(sub => sub.setName('liste').setDescription('Voir les bannis')),

    new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Voir les stats du bot')
        .addSubcommand(sub => sub.setName('serveur').setDescription('Stats globales'))
        .addSubcommand(sub => sub.setName('staff').setDescription('Classement du staff'))
        .addSubcommand(sub => 
            sub.setName('membre').setDescription('Historique d\'un membre')
                .addUserOption(opt => opt.setName('membre').setDescription('Le membre'))),

    new SlashCommandBuilder()
        .setName('canned')
        .setDescription('Gérer les réponses automatiques')
        .addSubcommand(sub => 
            sub.setName('ajouter').setDescription('Ajouter une réponse')
                .addStringOption(opt => opt.setName('nom').setDescription('Nom du raccourci').setRequired(true))
                .addStringOption(opt => opt.setName('contenu').setDescription('Le message à envoyer').setRequired(true)))
        .addSubcommand(sub => 
            sub.setName('supprimer').setDescription('Supprimer une réponse')
                .addStringOption(opt => opt.setName('nom').setDescription('Nom du raccourci').setRequired(true)))
        .addSubcommand(sub => sub.setName('liste').setDescription('Liste des réponses'))
        .addSubcommand(sub => 
            sub.setName('utiliser').setDescription('Envoyer une réponse rapide')
                .addStringOption(opt => opt.setName('nom').setDescription('Le raccourci').setRequired(true))),
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Mise à jour des commandes slash en cours...');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commandes },
        );

        console.log('C\'est bon, les commandes sont prêtes !');
    } catch (err) {
        console.error('Erreur déploiement :', err);
    }
})();
