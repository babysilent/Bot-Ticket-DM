import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const couleurs = {
    primaire: 0x5865F2,
    succes: 0x57F287,
    erreur: 0xED4245,
    alerte: 0xFEE75C,
    info: 0x5865F2,
    basse: 0x57F287,
    normale: 0x5865F2,
    haute: 0xEB459E,
    critique: 0xED4245,
    noteStaff: 0xFEE75C
};

export function creerEmbedTicket(ticket) {
    const embed = new EmbedBuilder()
        .setAuthor({ 
            name: `Ticket #${ticket.ticket_id.split('-')[1].toUpperCase()}`, 
            iconURL: 'https://i.imgur.com/w9Omi98.png'
        })
        .setTitle(ticket.subject)
        .setDescription(`> ${ticket.description || 'Pas de description.'}`)
        .setColor(recupCouleurPriorite(ticket.priority))
        .addFields(
            { name: '👤 Utilisateur', value: `<@${ticket.user_id}>`, inline: true },
            { name: '📂 Catégorie', value: `\`${ticket.category}\``, inline: true },
            { name: '📊 Priorité', value: recupBadgePriorite(ticket.priority), inline: true }
        )
        .setFooter({ text: 'FS25 Modding Community • Système de Support' })
        .setTimestamp();

    if (ticket.claimed_by) {
        embed.addFields({ name: '🛡️ Pris en charge par', value: `<@${ticket.claimed_by}>`, inline: true });
    }

    if (ticket.tags) {
        embed.addFields({ name: '🏷️ Tags', value: ticket.tags.split(',').map(t => `\`${t}\``).join(' '), inline: true });
    }

    return embed;
}

function recupCouleurPriorite(priorite) {
    const mappage = {
        'Low': couleurs.basse,
        'Normal': couleurs.normale,
        'High': couleurs.haute,
        'Critical': couleurs.critique
    };
    return mappage[priorite] || couleurs.primaire;
}

function recupBadgePriorite(priorite) {
    const badges = {
        'Low': '🟢 Basse',
        'Normal': '🔵 Normale',
        'High': '🟡 Haute',
        'Critical': '🔴 Critique'
    };
    return badges[priorite] || priorite;
}

export function creerLigneActions() {
    const ligne1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_fermer').setLabel('Fermer').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
        new ButtonBuilder().setCustomId('ticket_saisir').setLabel('Saisir').setStyle(ButtonStyle.Success).setEmoji('🙋‍♂️'),
        new ButtonBuilder().setCustomId('ticket_priorite').setLabel('Priorité').setStyle(ButtonStyle.Secondary).setEmoji('📊'),
        new ButtonBuilder().setCustomId('ticket_note').setLabel('Note').setStyle(ButtonStyle.Secondary).setEmoji('📝'),
        new ButtonBuilder().setCustomId('ticket_tag').setLabel('Tag').setStyle(ButtonStyle.Secondary).setEmoji('🏷️')
    );

    const ligne2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_ajouter_user').setLabel('Ajouter').setStyle(ButtonStyle.Secondary).setEmoji('👤'),
        new ButtonBuilder().setCustomId('ticket_retirer_user').setLabel('Retirer').setStyle(ButtonStyle.Secondary).setEmoji('🚫'),
        new ButtonBuilder().setCustomId('ticket_transcript').setLabel('Transcript').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
        new ButtonBuilder().setCustomId('ticket_renommer').setLabel('Renommer').setStyle(ButtonStyle.Secondary).setEmoji('✏️'),
        new ButtonBuilder().setCustomId('ticket_infos').setLabel('Infos').setStyle(ButtonStyle.Secondary).setEmoji('ℹ️')
    );

    return [ligne1, ligne2];
}

export function creerEmbedPanel() {
    return new EmbedBuilder()
        .setTitle('🚜 Centre de Support FS25 Modding')
        .setDescription(
            'Bienvenue sur le centre de support de la communauté **FS25 Modding**.\n\n' +
            'Pour nous aider à traiter votre demande rapidement, veuillez sélectionner la catégorie appropriée et remplir le formulaire avec précision.\n\n' +
            '**⏱️ Temps de réponse :** Moins de 24h\n' +
            '**⚠️ Rappel :** Soyez le plus précis possible.'
        )
        .setImage('https://i.imgur.com/0P6y0fE.png')
        .setColor(couleurs.primaire)
        .setFooter({ text: 'FS25 Modding Community', iconURL: 'https://i.imgur.com/w9Omi98.png' });
}

export function creerBoutonsPanel() {
    const ligne1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ouvrir_bug').setLabel('Bug Report').setStyle(ButtonStyle.Danger).setEmoji('🐛'),
        new ButtonBuilder().setCustomId('ouvrir_feature').setLabel('Feature Request').setStyle(ButtonStyle.Success).setEmoji('💡'),
        new ButtonBuilder().setCustomId('ouvrir_general').setLabel('Support Général').setStyle(ButtonStyle.Primary).setEmoji('❓')
    );
    const ligne2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ouvrir_collab').setLabel('Collaboration').setStyle(ButtonStyle.Secondary).setEmoji('🤝'),
        new ButtonBuilder().setCustomId('ouvrir_testing').setLabel('Mod Testing').setStyle(ButtonStyle.Secondary).setEmoji('🧪'),
        new ButtonBuilder().setCustomId('ouvrir_staff').setLabel('Rapport Staff').setStyle(ButtonStyle.Danger).setEmoji('🛡️')
    );
    return [ligne1, ligne2];
}

export async function genererTranscript(messages, ticket) {
    const messagesTries = [...messages.values()].reverse();
    
    let html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Transcript - ${ticket.ticket_id}</title>
        <style>
            :root {
                --bg: #313338;
                --header-bg: #2b2d31;
                --text: #dbdee1;
                --text-muted: #949ba4;
                --white: #ffffff;
                --blurple: #5865f2;
            }
            body { 
                background-color: var(--bg); 
                color: var(--text); 
                font-family: 'gg sans', 'Noto Sans', sans-serif; 
                margin: 0;
                padding: 0;
            }
            .header {
                background-color: var(--header-bg);
                padding: 40px 20px;
                border-bottom: 1px solid #1e1f22;
                text-align: center;
            }
            .header h1 { color: var(--white); margin: 0; font-size: 24px; }
            .header p { color: var(--text-muted); margin: 10px 0 0 0; }
            .container { padding: 20px; max-width: 1000px; margin: 0 auto; }
            .message { 
                display: flex;
                margin-bottom: 16px;
                padding: 5px 0;
            }
            .avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                margin-right: 16px;
                background-color: var(--blurple);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                flex-shrink: 0;
            }
            .msg-content { flex: 1; }
            .msg-header { margin-bottom: 4px; }
            .author { color: var(--white); font-weight: 500; font-size: 16px; margin-right: 8px; }
            .timestamp { color: var(--text-muted); font-size: 12px; }
            .text { line-height: 1.375rem; white-space: pre-wrap; word-wrap: break-word; }
            .embed {
                background-color: #2b2d31;
                border-left: 4px solid var(--blurple);
                border-radius: 4px;
                padding: 12px;
                margin-top: 8px;
                max-width: 520px;
            }
            .embed-title { color: var(--white); font-weight: 600; margin-bottom: 8px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Transcript: ${ticket.subject}</h1>
            <p>ID: ${ticket.ticket_id} • Auteur: ${ticket.user_id} • Catégorie: ${ticket.category}</p>
        </div>
        <div class="container">
    `;

    messagesTries.forEach(m => {
        const initiale = m.author.username.charAt(0).toUpperCase();
        html += `
            <div class="message">
                <div class="avatar">${initiale}</div>
                <div class="msg-content">
                    <div class="msg-header">
                        <span class="author">${m.author.username}</span>
                        <span class="timestamp">${m.createdAt.toLocaleString('fr-FR')}</span>
                    </div>
                    <div class="text">${m.content || ''}</div>
        `;

        if (m.attachments.size > 0) {
            m.attachments.forEach(attachment => {
                if (attachment.contentType?.startsWith('image/')) {
                    html += `<div class="text"><img src="${attachment.url}" style="max-width: 300px; border-radius: 4px; margin-top: 8px;" alt="image"></div>`;
                } else {
                    html += `<div class="text"><a href="${attachment.url}" style="color: var(--blurple); text-decoration: none;" target="_blank">📁 Fichier : ${attachment.name}</a></div>`;
                }
            });
        }

        if (m.embeds.length > 0) {
            m.embeds.forEach(embed => {
                html += `
                    <div class="embed">
                        ${embed.title ? `<div class="embed-title">${embed.title}</div>` : ''}
                        ${embed.description ? `<div class="text">${embed.description}</div>` : ''}
                    </div>
                `;
            });
        }

        html += `</div></div>`;
    });

    html += `</div></body></html>`;
    return Buffer.from(html, 'utf-8');
}
