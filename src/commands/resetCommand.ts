import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from './interfaces/command';
import { CustomStrings } from '../constants/strings';

const resetCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Resets a conversation.'),

  async execute(interaction: any) {
    await interaction.reply(CustomStrings.Reset);
  },
};
export default resetCommand;
