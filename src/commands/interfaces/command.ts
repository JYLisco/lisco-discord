import { SlashCommandBuilder } from '@discordjs/builders';
import { Interaction } from 'discord.js';

export interface Command {
  data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  execute(interaction: Interaction): Promise<void>;
}
