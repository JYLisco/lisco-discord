const { REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config();

var clientId = process.env.CLIENT_ID;
var token = process.env.BOT_TOKEN;

/* Grab all the commands in the 'commands' folder and prep for deploy */
const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".cjs"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

/* Construct the rest module and attempt to deploy the commands */
const rest = new REST({ version: "10" }).setToken(token);
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    /* Post the new set of global commands for the bot */
    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
})();
