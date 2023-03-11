const { SlashCommandBuilder } = require("discord.js");
const { PermissionsBitField } = require("discord.js");
const { reset } = require("../constants/strings.cjs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete")
        .setRequired(true)
    ) // Add an integer option for the amount of messages to delete
    .setDescription("Deletes a user-specified number of messages."),
  async execute(interaction) {
    // Check if user has the administrator permission
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    // Get the amount of messages to delete from the interaction options
    const amount = interaction.options.getInteger("amount");

    // Delete the specified number of messages
    try {
      await interaction.channel.bulkDelete(amount);
      await interaction.reply({
        content: `Deleted ${amount} messages. ${reset}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while deleting messages.",
        ephemeral: true,
      });
    }
  },
};
