import { Client, ClientOptions, Collection } from 'discord.js';

export class DiscordClient extends Client {
  commands: Collection<string, any>;
  constructor(options: ClientOptions) {
    super(options);
    this.commands = new Collection();
    this.loadCommands();
  }
  loadCommands() {
    // enter code here
  }
  loadEvents() {
    // enter code here
  }
}