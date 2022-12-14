import { initBot } from './utils/discord-bot.utils.js';
import { logger } from './utils/logger.utils.js';

try {
  await initBot();
} catch (error) {
  logger.error(error);
}
