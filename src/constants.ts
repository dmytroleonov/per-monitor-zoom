export const messageTypes = ["monitor-change"] as const;
export type MessageType = (typeof messageTypes)[number];
