import { Events, DMChannel, TextChannel, Message } from 'discord.js';
import dotenv from 'dotenv';
import { ChatCompletionRequestMessage } from 'openai';
import { CustomStrings } from '../constants/strings';
import { AppLogger, Loggers } from '../_util/resources/appLogger';
import { trimMessageLog } from '../_util/openai/gpt/trimMessageLog';
import { postDiscordReply } from '../_util/discord/postDiscordReply';
import { formatDate } from '../_util/strings/dateFormat';
import { OpenAiClient } from '../_util/openai/openAiClient';
import { generateSystemMessage } from '../_util/discord/generateSystemMessage';
dotenv.config();

/* Max Token Count */
const MAX_TOKEN_COUNT = 4096;
const RESPONSE_TOKEN_COUNT = 500;
const PROMPT_TOKEN_COUNT = MAX_TOKEN_COUNT - RESPONSE_TOKEN_COUNT; //Err on Side of Caution...

const logger = AppLogger.getInstance();
const openai = OpenAiClient.getInstance();

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
            logger.info(Loggers.App, `${CustomStrings.Divider}`);
            let sortedMessages = relevantMessages.sort(
              (a: Message, b: Message) =>
                a.createdTimestamp - b.createdTimestamp
            );
            logger.info(
              Loggers.App,
              `Fetched ${sortedMessages.size} messages in the channel`
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
    var resetTime = formatDate(new Date(resetMessage.createdTimestamp));
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

const sendMessagesToApi = async (
  triggerMessage: Message,
  messages: Array<Message>
) => {
  var channel = triggerMessage.channel as TextChannel;
  /* Start Constructing Chat History for Conversations */
  let messageLog: Array<ChatCompletionRequestMessage> = [
    {
      role: 'system',
      content: await generateSystemMessage(triggerMessage),
    },
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
  logger.info(Loggers.App, `${CustomStrings.Divider}`);
  /* Try hitting the ChatGPT API with the conversation */
  try {
    /* Start the 'Is Typing' indicator while GPT constructs a response */
    await channel.sendTyping();
    const response = await openai.chat(messageLog);

    if (response) {
      /* Push the message as a reply in discord */
      await postDiscordReply(triggerMessage, response.content);
    } else {
      throw 'No API Response';
    }
  } catch (err) {
    logger.error(Loggers.App, err);
    return triggerMessage.reply(CustomStrings.ErrorMessage);
  }
};
