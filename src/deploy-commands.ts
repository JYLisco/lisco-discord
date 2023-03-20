import { REST, SlashCommandBuilder } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { AppLogger, Loggers } from './_util/resources/appLogger';
import { CustomStrings } from './constants/strings';

dotenv.config();

const clientId = process.env.CLIENT_ID!;
const token = process.env.BOT_TOKEN!;
const logger = AppLogger.getInstance();

/* Grab all the commands in the 'commands' folder and prep for deploy */
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.ts'));

logger.info(Loggers.App, CustomStrings.Divider);
for (const file of commandFiles) {
  const commandModule: { data: SlashCommandBuilder } =
    require(`./commands/${file}`).default;
  logger.info(
    Loggers.App,
    `=> /${commandModule.data.name}: ${commandModule.data.description}`
  );
  commands.push(commandModule.data.toJSON());
}
logger.info(Loggers.App, CustomStrings.Divider);

/* Construct the rest module and attempt to deploy the commands */
const rest = new REST({ version: '10' }).setToken(token);
(async () => {
  try {
    logger.info(
      Loggers.App,
      `Started refreshing ${commands.length} application (/) commands.`
    );

    /* Post the new set of global commands for the bot */
    const data = (await rest.put(`/applications/${clientId}/commands`, {
      body: commands,
    })) as Array<string>;

    logger.info(
      Loggers.App,
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
})();
