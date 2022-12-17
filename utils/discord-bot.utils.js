import { config } from 'dotenv';
import * as discord from 'discord.js';
import { logger } from './logger.utils.js';
import { ask } from './open-ai.utils.js';

config();

const {
  Client, IntentsBitField, REST, Routes, Events, Partials,
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

function createClient({ intents, events, partials }) {
  const eventsArray = Object.entries(events);
  const client = new Client({
    intents,
    partials,
  });
  client.on(Events.ClientReady, () => {
    logger.info('The AI bot is online');
  });
  for (const [eventKey, eventAction] of eventsArray) {
    client.on(eventKey, eventAction);
  }

  client.login(token);
}

export async function initBot() {
  await addCommands();
  const clientGuilds = createClient({
    intents: [IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMessages],
    events: {
      [Events.InteractionCreate]: async (interaction) => {
        logger.info('interaction', interaction);
        if (!interaction.isChatInputCommand()) return;
        if (interaction.commandName === 'ping') {
          await interaction.reply('Pong!');
        }
      },
      [Events.MessageCreate]: async (message) => {
        const identifier = `<@${clientId}>`;
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
      },
    },
  });

  const clientDirectMessages = createClient({
    intents: [IntentsBitField.Flags.DirectMessages],
    partials: [Partials.Channel],
    events: {
      [Events.InteractionCreate]: async (interaction) => {
        logger.info('interaction', interaction);
        if (!interaction.isChatInputCommand()) return;
        if (interaction.commandName === 'ping') {
          await interaction.reply('Pong!');
        }
      },
      [Events.MessageCreate]: async (message) => {
        if (message) {
          if (message.author.id !== clientId) {
            const prompt = message.content;
            logger.info('message to bot', message);
            if (prompt.length) {
              const answer = await ask(prompt);
              if (answer.length) {
                await message.channel.send(answer);
              }
            }
          }
        }
      },
    },
  });

  return [clientGuilds, clientDirectMessages];
}
