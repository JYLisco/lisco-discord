import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { resolve } from 'path';
import path from 'node:path';
import dotenv from 'dotenv';
import { Command } from './commands/interfaces/command';
import { DiscordClient } from './interfaces/discordClient';
import { AppLogger } from './_util/appLogger';

/* Retrieve environment variables */
dotenv.config();

const logger = AppLogger.getInstance();

/* Initialize Client */
const client = new DiscordClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
}); // specify the Client type parameter

client.commands = new Collection<string, any>();

/* Load Commands */
const commandFiles = readdirSync(resolve(__dirname, 'commands')).filter(
  (file) => file.endsWith('.ts')
);

for (const file of commandFiles) {
  const command: Command = require(`./commands/${file}`).default;
  client.commands.set(command.data.name, command);
}

/* Load Event handling */

const eventsPath = path.join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter((file) =>
  file.endsWith('.ts')
);

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args: any[]) => event.execute(...args));
  } else {
    client.on(event.name, (...args: any[]) => event.execute(...args));
  }
}

/* Login to Discord */
client.login(process.env.BOT_TOKEN);
