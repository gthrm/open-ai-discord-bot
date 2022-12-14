import { Configuration, OpenAIApi } from 'openai';
import { config } from 'dotenv';
import { logger } from './logger.utils.js';

config();

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_API_KEY,
});
const openAi = new OpenAIApi(configuration);
export async function ask(prompt) {
  const response = await openAi.createCompletion({
    model: 'text-davinci-003',
    prompt,
    temperature: 0.7,
    max_tokens: 2000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  logger.info('response.data', response.data);
  const answer = response.data.choices.map(({ text }) => text).join('\n');
  return answer;
}
