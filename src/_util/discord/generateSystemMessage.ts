import { Message, TextChannel } from 'discord.js';
import { AppLogger, Loggers } from '../resources/appLogger';
import dotenv from 'dotenv';

const logger = AppLogger.getInstance();

dotenv.config();

export const generateSystemMessage = async (
  mission?: string
): Promise<string> => {
  let systemMessage: string = ((('Your Name Is ' +
    process.env.BOT_NAME) as string) + process.env.BOT_DESC) as string;

  if (mission) {
    systemMessage += ` Your mission: ${mission}`;
  }

  return systemMessage;
};
