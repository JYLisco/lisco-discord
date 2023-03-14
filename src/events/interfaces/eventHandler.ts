import { Interaction } from 'discord.js';

export type EventHandler<T> = (payload: T) => void;
