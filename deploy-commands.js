require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('rank-panel')
    .setDescription('يرسل زر حاسبة اللفل'),
  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('حساب اللفل مباشرة بدون زر')
    .addIntegerOption((o) => o.setName('xp').setDescription('نقاطك الحالية').setRequired(true))
    .addIntegerOption((o) => o.setName('target').setDescription('اللفل اللي تبي توصله').setRequired(true))
    .addIntegerOption((o) => o.setName('amount').setDescription('كم يشيل الميناء الواحد').setRequired(true))
    .addIntegerOption((o) => o.setName('value').setDescription('كم خبرة تطلع على الحبة').setRequired(true))
].map((command) => command.toJSON());

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
  console.error('حط DISCORD_TOKEN و CLIENT_ID و GUILD_ID في ملف .env');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Deploying slash commands...');
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log('Done ✅');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
