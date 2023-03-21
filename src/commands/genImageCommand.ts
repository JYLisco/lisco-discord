import { SlashCommandBuilder } from 'discord.js';
import { Command } from './interfaces/command';
import { OpenAiClient } from '../_util/openai/openAiClient';

const openai = OpenAiClient.getInstance();

const genImageCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('genimage')
    .setDescription('Generates an image from the specified prompt.')
    .addStringOption((option) =>
      option
        .setName('prompt')
        .setDescription('The prompt to generate image from.')
        .setRequired(true)
    ),

  async execute(interaction: any) {
    const prompt = interaction.options.getString('prompt');
    await interaction.reply(`Generating image based on prompt: "${prompt}"`);

    const response = await openai.image(prompt);

    if (response) {
      const b64JsonArray: string[] = response
        ? response?.map((x) => x.b64_json ?? '')
        : [];

      // Create an array of MessageAttachment objects from the base64 strings
      const attachmentArray = b64JsonArray.map((b64Json: string) => {
        const buffer = Buffer.from(b64Json, 'base64');
        return { attachment: buffer, name: 'image.png' };
      });

      await interaction.followUp({ files: attachmentArray });
    }
  },
};

export default genImageCommand;
