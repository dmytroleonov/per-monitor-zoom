export const messageTypes = ["monitor-change"] as const;
export type MessageType = (typeof messageTypes)[number];

export const MONITORS_KEY = "monitors";
export const ZOOM_LEVELS = [
  0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0, 2.5,
  3.0, 4.0, 5.0,
];
export const DEFAULT_ZOOM_LEVEL = 1;
