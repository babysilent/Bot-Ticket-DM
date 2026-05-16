import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { gestionInteractions } from './handlers/interactionHandler.js';
import { gestionMessages } from './events/messageCreate.js';
import { setupFermetureAuto } from './handlers/autoClose.js';

import ticketOuvrir from './commands/ticket-open.js';
import ticketGerer from './commands/ticket-manage.js';
import commandesAdmin from './commands/admin.js';
import panelModo from './commands/mod-panel.js';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message],
});

client.commands = new Collection();

client.once('ready', () => {
    console.log(chalk.green(`Connecté en tant que ${client.user.tag} !`));
    console.log(chalk.blue('Bot de tickets FS25 prêt à l\'emploi.'));
    setupFermetureAuto(client);
});

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            const { commandName } = interaction;
            
            if (commandName === 'ticket') {
                await ticketOuvrir.execute(interaction);
            } else if (['close', 'claim', 'unclaim', 'priority', 'add-user', 'remove-user', 'rename', 'note'].includes(commandName)) {
                await ticketGerer.execute(interaction);
            } else if (['panel', 'blacklist', 'stats', 'canned'].includes(commandName)) {
                await commandesAdmin.execute(interaction);
            } else if (commandName === 'modpanel') {
                await panelModo.execute(interaction);
            }
        } else {
            await gestionInteractions(interaction);
        }
    } catch (erreur) {
        console.error(chalk.red('Erreur lors d\'une interaction :'), erreur);
        const reponseErreur = { content: 'Oups, un petit problème est survenu...', ephemeral: true };
        
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(reponseErreur).catch(() => null);
        } else {
            await interaction.reply(reponseErreur).catch(() => null);
        }
    }
});

client.on('messageCreate', gestionMessages);

client.login(process.env.DISCORD_TOKEN);
