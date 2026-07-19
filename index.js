require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const { parseNum, splitMessage, calculateRankList } = require('./calculator');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

function isEphemeral() {
  return String(process.env.EPHEMERAL_REPLY ?? 'true').toLowerCase() !== 'false';
}

async function sendLong(interaction, text) {
  const chunks = splitMessage(text);
  const ephemeral = isEphemeral();

  if (interaction.deferred || interaction.replied) {
    await interaction.followUp({ content: chunks[0], ephemeral });
  } else {
    await interaction.reply({ content: chunks[0], ephemeral });
  }

  for (let i = 1; i < chunks.length; i++) {
    await interaction.followUp({ content: chunks[i], ephemeral });
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag} ✅`);
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'rank-panel') {
        const embed = new EmbedBuilder()
          .setTitle('📦 حاسبة اللفل والموانئ')
          .setDescription([
            'اضغط الزر تحت واكتب بياناتك:',
            '',
            'النقاط الحالية',
            'اللفل اللي تبي توصله',
            'كم يشيل الميناء الواحد',
            'كم خبرة تطلع على الحبة'
          ].join('\n'))
          .setColor(0x5865F2);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('open_rank_modal')
            .setLabel('احسب اللفل')
            .setEmoji('📦')
            .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
        return;
      }

      if (interaction.commandName === 'rank') {
        const currentXp = interaction.options.getInteger('xp');
        const targetRank = interaction.options.getInteger('target');
        const portAmount = interaction.options.getInteger('amount');
        const xpPerItem = interaction.options.getInteger('value');

        const result = calculateRankList({ currentXp, targetRank, portAmount, xpPerItem });
        await sendLong(interaction, result);
        return;
      }
    }

    if (interaction.isButton() && interaction.customId === 'open_rank_modal') {
      const modal = new ModalBuilder()
        .setCustomId('rank_calculator_modal')
        .setTitle('حاسبة اللفل');

      const currentXp = new TextInputBuilder()
        .setCustomId('current_xp')
        .setLabel('نقاطك الحالية')
        .setPlaceholder('مثال: 824754')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const targetRank = new TextInputBuilder()
        .setCustomId('target_rank')
        .setLabel('اللفل اللي تبي توصله')
        .setPlaceholder('مثال: 75')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const portAmount = new TextInputBuilder()
        .setCustomId('port_amount')
        .setLabel('كم يشيل الميناء الواحد؟')
        .setPlaceholder('مثال: 1225')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const xpPerItem = new TextInputBuilder()
        .setCustomId('xp_per_item')
        .setLabel('كم خبرة تطلع على الحبة؟')
        .setPlaceholder('مثال: 10')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(currentXp),
        new ActionRowBuilder().addComponents(targetRank),
        new ActionRowBuilder().addComponents(portAmount),
        new ActionRowBuilder().addComponents(xpPerItem)
      );

      await interaction.showModal(modal);
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId === 'rank_calculator_modal') {
      const currentXp = parseNum(interaction.fields.getTextInputValue('current_xp'));
      const targetRank = parseNum(interaction.fields.getTextInputValue('target_rank'));
      const portAmount = parseNum(interaction.fields.getTextInputValue('port_amount'));
      const xpPerItem = parseNum(interaction.fields.getTextInputValue('xp_per_item'));

      const result = calculateRankList({ currentXp, targetRank, portAmount, xpPerItem });
      await sendLong(interaction, result);
      return;
    }
  } catch (error) {
    console.error(error);
    const message = `❌ ${error.message || 'صار خطأ، تأكد من الأرقام.'}`;
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: message, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: message, ephemeral: true }).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
