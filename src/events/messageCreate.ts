

import { Events, DMChannel } from "discord.js";
import dotenv from "dotenv";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { mergeArray } from "../_util/mergeArray";
import { splitMessage } from "../_util/splitMessage";
import { japaneseBehavior, liscoBehavior } from "../constants/behaviors";
import { reset } from "../constants/strings";
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
  async execute(triggerMessage: any) {
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
      .then(async (channelMessages: any) => {
        await findRelevantMessages(triggerMessage, channelMessages).then(
          async (relevantMessages) => {
            let sortedMessages = relevantMessages.sort(
              (a: any, b: any) => a.createdTimestamp - b.createdTimestamp
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

const findRelevantMessages = async (message: any, messages: any) => {
  const resetMessage = messages.find(
    (msg: any) => msg.content.includes(reset) && msg.author.username === "L.I.S.C.O"
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

const findBehaviorPackage = (channel: any) => {
  switch (channel) {
    case "japan-ai":
      return japaneseBehavior;
    default:
      return liscoBehavior;
  }
};

const sendMessagesToApi = async (triggerMessage: any, messages: any) => {
  /* Start Constructing Chat History for Conversations */
  let messageLog: Array<ChatCompletionRequestMessage> = [
    {
      role: "system",
      content: findBehaviorPackage(triggerMessage.channel.name),
    },
  ];
  messages.forEach((m: { author: { bot: any; username: string; }; content: any; }) => {
    if (m.author.bot) {
      if (m.author.username === "L.I.S.C.O") {
        messageLog.push({ role: "assistant", content: m.content });
      }
    } else {
      messageLog.push({
        role: "user",
        content: m.content,
      });
    }
  });

  /* Try hitting the ChatGPT API with the conversation */
  try {
    /* Start the 'Is Typing' indicator while GPT constructs a response */
    await triggerMessage.channel.sendTyping();
    console.log("Attempting to hit ChatGPT Api...");
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messageLog,
    });

    /* Break the response into an array of strings for threading. */
    const content = response.data.choices[0].message;

    console.log(content);

    //const chunks = mergeArray(splitMessage(content.content));

    if (content){
      const chunks = 
      content.content.length <= 2000
        ? [content.content]
        : mergeArray(splitMessage(content.content));

    console.log(
      "Chunks-------------------------------------------------------------------------------------"
    );
    console.log(chunks);
    console.log(
      "END Chunks-------------------------------------------------------------------------------------"
    );

    /* Push the message as a reply in discord */
    await postToDiscord(triggerMessage, chunks);
    }
    else{
      throw "No API Response"
    }

  } catch (err) {
    console.log(err);
    return triggerMessage.reply(
      "Unfortunately, I ran into an error while processing your request. I apologize for the inconvenience."
    );
  }
};


const postToDiscord = async (triggerMessage: any, chunks: any) => {
  // Send the first message as a reply to the trigger message
  const firstMessage = await triggerMessage.reply(chunks[0]);
  let previousMessage = firstMessage;

  // Send subsequent messages as replies to the first message
  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i];
    const message = await previousMessage.reply(chunk);
    previousMessage = message;
  }
};
