import { config } from 'dotenv';
import * as discord from 'discord.js';
import { logger } from './logger.utils.js';
import { ask } from './open-ai.utils.js';

config();

const {
  Client, IntentsBitField, REST, Routes, Events,
} = discord;

const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;

async function addCommands() {
  const commands = [
    {
      name: 'ping',
      description: 'Replies with Pong!',
    },
  ];

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    logger.info('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    logger.info('Successfully reloaded application (/) commands.');
  } catch (error) {
    logger.error(error);
  }
}

export async function initBot() {
  await addCommands();
  const client = new Client({
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.DirectMessages,
    ],
  });
  client.on(Events.ClientReady, () => {
    logger.info('The AI bot is online'); // message when bot is online
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    logger.info('interaction', interaction);
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'ping') {
      await interaction.reply('Pong!');
    }
  });

  client.on(Events.MessageCreate, async (message) => {
    const identifier = `<@${process.env.CLIENT_ID}>`;
    if (message.content.includes(identifier)) {
      logger.info('message to bot', message);
      const prompt = message.content.replaceAll(identifier, '');
      if (prompt.length) {
        const answer = await ask(prompt);
        if (answer.length) {
          await message.channel.send(answer);
        }
      }
    }
  });

  client.login(token);

  return client;
}
