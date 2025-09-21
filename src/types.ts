import type { Tabs } from "webextension-polyfill";
import type {
  BACKGROUND_MESSAGE_TYPES,
  CONTENT_MESSAGE_TYPES,
  CONTENT_RESPONSE_MESSAGE_TYPES,
} from "./constants";

export type BackgroundMessageType = (typeof BACKGROUND_MESSAGE_TYPES)[number];
export type ContentMessageType = (typeof CONTENT_MESSAGE_TYPES)[number];
export type ContentResponseMessageType =
  (typeof CONTENT_RESPONSE_MESSAGE_TYPES)[number];
export type MessageType =
  | ContentMessageType
  | BackgroundMessageType
  | ContentResponseMessageType;

export type Monitor = {
  width: number;
  height: number;
  defaultZoomLevel: number;
};

export type MonitorKey = {
  width: number;
  height: number;
};

export type TabWithId = Tabs.Tab & { id: number };

type BaseMessage<
  TType extends MessageType,
  TContent extends Record<string, unknown>,
> = {
  type: TType;
} & TContent;

export type MonitorChangeMessage = BaseMessage<"monitor-change", MonitorKey>;
export type PageLoadMessage = BaseMessage<"page-load", MonitorKey>;
export type ZoomChangeMessage = BaseMessage<"zoom-change", MonitorKey>;
export type ZoomResetMessage = BaseMessage<"zoom-reset", MonitorKey>;
export type BackgroundMessage =
  | MonitorChangeMessage
  | PageLoadMessage
  | ZoomChangeMessage
  | ZoomResetMessage;

export type GetMonitorKeyMessage = BaseMessage<"get-monitor-key", {}>;
export type StartZoomMessage = BaseMessage<"start-zoom", {}>;
export type ContentMessage = GetMonitorKeyMessage | StartZoomMessage;

export type MonitorKeyMessage = BaseMessage<"monitor-key", MonitorKey>;
export type ContentResponseMessage = MonitorKeyMessage;
