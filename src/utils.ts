import { messageTypes, type MessageType } from "./constants";
import type { Message } from "./types";

export function isMessage(msg: unknown): msg is Message {
  return messageTypes.includes((msg as { type?: string })?.type as MessageType);
}
