const { Events, DMChannel } = require("discord.js");
const dotenv = require("dotenv");
const { Configuration, OpenAIApi } = require("openai");
const { reset } = require("../constants/strings.cjs");
const {
  japaneseBehavior,
  liscoBehavior,
} = require("../constants/behaviors.cjs");

dotenv.config();

/* Initialize the OpenAIAPI with the .env API Key */
const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

const channels = ["lisco-ai", "japan-ai"];

module.exports = {
  name: Events.MessageCreate,
  async execute(triggerMessage) {
    if (triggerMessage.author.bot) return;
    console.log(channels);
    if (
      !channels.includes(triggerMessage.channel.name) &&
      !(triggerMessage.channel instanceof DMChannel)
    )
      return;

    console.log(
      `Message from ${triggerMessage.author.username} in channel: ${triggerMessage.channel.name}. Processing...`
    );

    /* Fetch conversations to this point. */
    triggerMessage.channel.messages
      .fetch({ limit: 100 })
      .then(async (channelMessages) => {
        await findRelevantMessages(triggerMessage, channelMessages).then(
          async (relevantMessages) => {
            let sortedMessages = relevantMessages.sort(
              (a, b) => a.createdTimestamp - b.createdTimestamp
            );
            console.log(
              `Fetched ${sortedMessages.size} messages in the channel`
            );
            await sendMessagesToApi(triggerMessage, sortedMessages);
          }
        );
      })

      .catch(console.error);
  },
};

const findRelevantMessages = async (message, messages) => {
  const resetMessage = messages.find(
    (msg) => msg.content.includes(reset) && msg.author.username === "L.I.S.C.O"
  );
  if (resetMessage) {
    console.log(`Found reset command.`);
    console.log("Reset: ", {
      id: resetMessage.id,
      content: resetMessage.content,
      bot: resetMessage.author.bot,
      author: resetMessage.author.username,
    });
    console.log(`Loading messages after reset command...`);
    const postResetMessages = await message.channel.messages.fetch({
      limit: 100,
      after: resetMessage.id,
    });
    return postResetMessages;
  } else {
    console.log(`No reset command found. Loading messages...`);
    return messages;
  }
};

const findBehaviorPackage = (channel) => {
  switch (channel) {
    case "japan-ai":
      return japaneseBehavior;
    default:
      return liscoBehavior;
  }
};

const sendMessagesToApi = async (triggerMessage, messages) => {
  /* Start Constructing Chat History for Conversations */
  let messageLog = [
    {
      role: "system",
      content: findBehaviorPackage(triggerMessage.channel.name),
    },
  ];
  messages.forEach((m) => {
    if (m.author.bot) {
      if (m.author.username === "L.I.S.C.O") {
        messageLog.push({ role: "assistant", content: m.content });
      }
    } else {
      messageLog.push({
        role: "user",
        username: m.username,
        content: m.content,
      });
    }
  });

  /* Try hitting the ChatGPT API with the conversation */
  try {
    /* Start the 'Is Typing' inicator while GPT constructs a response */
    await triggerMessage.channel.sendTyping();
    console.log("Attempting to hit ChatGPT Api...");
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messageLog,
    });

    /* Push the message as a reply in discord */
    const content = response.data.choices[0].message;
    return triggerMessage.reply(content);
  } catch (err) {
    return triggerMessage.reply(
      "Unfortunately, I ran into an error while processing your request. I apologize for the inconvenience."
    );
  }
};
