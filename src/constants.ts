export const BACKGROUND_MESSAGE_TYPES = [
  "monitor-change",
  "page-load",
  "zoom-change",
  "zoom-reset",
] as const;
export const CONTENT_MESSAGE_TYPES = ["get-monitor-key", "start-zoom"] as const;
export const CONTENT_RESPONSE_MESSAGE_TYPES = ["monitor-key"] as const;

export const MONITORS_KEY = "monitors";
export const ZOOM_FACTORS = [
  0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0, 2.5,
  3.0, 4.0, 5.0,
];
export const DEFAULT_ZOOM_FACTOR = 1;
