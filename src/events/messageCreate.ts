import { Events, DMChannel, TextChannel, Message } from 'discord.js';
import dotenv from 'dotenv';
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from 'openai';
import { CustomStrings } from '../constants/strings';
import { AppLogger, Loggers } from '../_util/resources/appLogger';
import { trimMessageLog } from '../_util/openai/gpt/trimMessageLog';
import { processTextForDiscord } from '../_util/discord/processDiscordMessage';
import { postDiscordReply } from '../_util/discord/postDiscordReply';
dotenv.config();

/* Max Token Count */
const MAX_TOKEN_COUNT = 4096;
const RESPONSE_TOKEN_COUNT = 500;
const PROMPT_TOKEN_COUNT = MAX_TOKEN_COUNT - RESPONSE_TOKEN_COUNT; //Err on Side of Caution...

/* Initialize the OpenAIAPI with the .env API Key */
const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

const logger = AppLogger.getInstance();

module.exports = {
  name: Events.MessageCreate,
  async execute(triggerMessage: any) {
    if (triggerMessage.author.bot) return;

    /* Respond in "-ai" channels and in DM's */
    if (
      triggerMessage.channel instanceof TextChannel &&
      !triggerMessage.channel.name.endsWith('-ai') &&
      !(triggerMessage.channel instanceof DMChannel)
    ) {
      return;
    }

    logger.info(
      Loggers.App,
      `Message from ${triggerMessage.author.username} in channel: ${triggerMessage.channel.name}. Processing...`
    );

    /* Fetch conversations to this point. */
    triggerMessage.channel.messages
      .fetch({ limit: 100 })
      .then(async (channelMessages: any) => {
        await findRelevantMessages(triggerMessage, channelMessages).then(
          async (relevantMessages) => {
            let sortedMessages = relevantMessages.sort(
              (a: Message, b: Message) =>
                a.createdTimestamp - b.createdTimestamp
            );
            logger.info(
              Loggers.App,
              `Fetched ${sortedMessages.length} messages in the channel`
            );
            await sendMessagesToApi(triggerMessage, sortedMessages);
          }
        );
      })

      .catch(console.error);
  },
};

const findRelevantMessages = async (message: Message, messages: any) => {
  var channel = message.channel as TextChannel;

  const resetMessage = messages.find(
    (msg: Message) =>
      msg.content.includes(CustomStrings.Reset) &&
      msg.author.username === 'L.I.S.C.O'
  );
  if (resetMessage) {
    var resetTime = resetMessage.createdTimestamp;
    logger.info(Loggers.App, `Loading messages after reset at ${resetTime}...`);
    const postResetMessages = await channel.messages.fetch({
      limit: 100,
      after: resetMessage.id,
    });
    return postResetMessages;
  } else {
    logger.info(Loggers.App, `No reset command found. Loading messages...`);
    let sortedMessages = messages.sort(
      (a: Message, b: Message) => a.createdTimestamp - b.createdTimestamp
    );
    return sortedMessages;
  }
};

const generateSystemMessage = async (
  discordMessage: Message
): Promise<ChatCompletionRequestMessage> => {
  let systemMessage: string = CustomStrings['Identity'];
  const channel = discordMessage.channel;

  try {
    // Fetches the channel object from the Discord API to get its topic
    const fetchedChannel = await channel.fetch();
    if (fetchedChannel instanceof TextChannel) {
      const channelTopic = fetchedChannel.topic;

      if (channelTopic && channelTopic.includes('Mission:')) {
        const mission = channelTopic.split('Mission:')[1].trim();
        systemMessage += ` Your mission: ${mission}`;
      }
    }
    logger.info(Loggers.App, 'System Message', systemMessage);
  } catch {
    logger.error(
      Loggers.App,
      `Failed to fetch system Message. Reverting to default.`
    );
  }

  const chatCompletionMessage: ChatCompletionRequestMessage = {
    role: 'system',
    content: systemMessage,
  };

  return chatCompletionMessage;
};

const sendMessagesToApi = async (
  triggerMessage: Message,
  messages: Array<Message>
) => {
  var channel = triggerMessage.channel as TextChannel;
  /* Start Constructing Chat History for Conversations */
  let messageLog: Array<ChatCompletionRequestMessage> = [
    await generateSystemMessage(triggerMessage),
  ];
  messages.forEach(
    (m: { author: { bot: any; username: string }; content: any }) => {
      if (m.author.bot) {
        if (m.author.username === 'L.I.S.C.O') {
          messageLog.push({ role: 'assistant', content: m.content });
        }
      } else {
        messageLog.push({
          role: 'user',
          content: m.content,
        });
      }
    }
  );

  messageLog = trimMessageLog(messageLog, PROMPT_TOKEN_COUNT);
  logger.info(Loggers.App, `Trimmed to ${messageLog.length - 1} messages.`);
  /* Try hitting the ChatGPT API with the conversation */
  try {
    /* Start the 'Is Typing' indicator while GPT constructs a response */
    await channel.sendTyping();
    logger.info(Loggers.App, 'Attempting to hit ChatGPT Api...');
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: messageLog,
    });

    /* Break the response into an array of strings for threading. */
    const content = response.data.choices[0].message;

    logger.info(Loggers.Api, `Response${CustomStrings.Divider}`);
    logger.info(Loggers.Api, content?.content);
    logger.info(Loggers.Api, `END Response${CustomStrings.Divider}`);
    //const chunks = mergeArray(splitMessage(content.content));

    if (content) {
      /* Push the message as a reply in discord */
      await postDiscordReply(triggerMessage, content.content);
    } else {
      throw 'No API Response';
    }
  } catch (err) {
    logger.error(Loggers.App, err);
    return triggerMessage.reply(CustomStrings.ErrorMessage);
  }
};
