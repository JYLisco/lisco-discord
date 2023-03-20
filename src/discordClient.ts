import { Client, ClientOptions, Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { resolve } from 'path';
import path from 'node:path';
import { Command } from './commands/interfaces/command';

export class DiscordClient extends Client {
  commands: Collection<string, any>;
  constructor(options: ClientOptions) {
    super(options);
    this.commands = new Collection<string, any>();
    this.loadCommands();
  }
  loadCommands() {
    /* Load Commands */
    const commandFiles = readdirSync(resolve(__dirname, 'commands')).filter(
      (file) => file.endsWith('.ts')
    );

    for (const file of commandFiles) {
      const command: Command = require(`./commands/${file}`).default;
      this.commands.set(command.data.name, command);
    }
  }
  loadEvents() {
    /* Load Event handling */

    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = readdirSync(eventsPath).filter((file) =>
      file.endsWith('.ts')
    );

    for (const file of eventFiles) {
      const filePath = path.join(eventsPath, file);
      const event = require(filePath);
      if (event.once) {
        this.once(event.name, (...args: any[]) => event.execute(...args));
      } else {
        this.on(event.name, (...args: any[]) => event.execute(...args));
      }
    }
  }
}
