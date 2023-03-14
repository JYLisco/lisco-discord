import { REST, SlashCommandBuilder } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const clientId = process.env.CLIENT_ID!;
const token = process.env.BOT_TOKEN!;

/* Grab all the commands in the 'commands' folder and prep for deploy */
const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".ts"));

console.log('----------------------------------------------------')
for (const file of commandFiles) {
  const commandModule: { data: SlashCommandBuilder } = require(`./commands/${file}`).default;
  console.log(`=> /${commandModule.data.name}: ${commandModule.data.description}`)
  commands.push(commandModule.data.toJSON());
}
console.log('----------------------------------------------------')

/* Construct the rest module and attempt to deploy the commands */
const rest = new REST({ version: "10" }).setToken(token);
(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    /* Post the new set of global commands for the bot */
    const data = await rest.put(
      `/applications/${clientId}/commands`,
      { body: commands }
    ) as Array<string>;

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
