export enum OpenAiConstants {
  RESPONSE_TOKEN_COUNT = 500,
  MAX_CONVERSATION_COUNT = 35,
}

export enum ImageAspectRatios {
  Small = '256x256',
  Medium = '512x512',
  Large = '1024x1024',
}

export enum GptModels {
  Gpt4 = 'gpt-4',
  Gpt3_5_Turbo = 'gpt-3.5-turbo',
}

export function getModelFromString(value: string): GptModels {
  return GptModels[value as keyof typeof GptModels] || GptModels.Gpt4;
}

export function getTokenCountFromGptModel(model: GptModels): number {
  return getMaxTokenCount(model) - OpenAiConstants.RESPONSE_TOKEN_COUNT;
}

function getMaxTokenCount(model: GptModels): number {
  switch (model) {
    case GptModels.Gpt4:
      return 8192;
    case GptModels.Gpt3_5_Turbo:
      return 4096;
    default:
      return 4096;
  }
}
