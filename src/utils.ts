import browser from "webextension-polyfill";
import {
  DEFAULT_ZOOM_LEVEL,
  BACKGROUND_MESSAGE_TYPES,
  MONITORS_KEY,
  CONTENT_MESSAGE_TYPES,
  CONTENT_RESPONSE_MESSAGE_TYPES,
} from "./constants";
import type {
  BackgroundMessage,
  BackgroundMessageType,
  ContentMessage,
  ContentMessageType,
  ContentResponseMessage,
  ContentResponseMessageType,
  Monitor,
  MonitorKey,
} from "./types";

export function isBackgroundMessage(msg: unknown): msg is BackgroundMessage {
  return BACKGROUND_MESSAGE_TYPES.includes(
    (msg as { type?: string })?.type as BackgroundMessageType,
  );
}

export function isContentMessage(msg: unknown): msg is ContentMessage {
  return CONTENT_MESSAGE_TYPES.includes(
    (msg as { type?: string })?.type as ContentMessageType,
  );
}

export function isContentResponseMessage(
  msg: unknown,
): msg is ContentResponseMessage {
  return CONTENT_RESPONSE_MESSAGE_TYPES.includes(
    (msg as { type?: string })?.type as ContentResponseMessageType,
  );
}

export async function getMonitors(): Promise<Monitor[]> {
  const data = (await browser.storage.local.get(MONITORS_KEY)) as {
    [MONITORS_KEY]?: Monitor[];
  };

  return data[MONITORS_KEY] ?? [];
}

export async function saveMonitors(monitors: Monitor[]): Promise<void> {
  await browser.storage.local.set({ [MONITORS_KEY]: monitors });
}

export function getMonitorKey(monitor: Monitor): MonitorKey {
  return { width: monitor.width, height: monitor.height };
}

export function isSpecificMonitor(
  monitor: Monitor,
  { width, height }: MonitorKey,
): boolean {
  return monitor.width === width && monitor.height === height;
}

export async function findMonitor(
  key: MonitorKey,
): Promise<Monitor | undefined> {
  return getMonitors().then((monitors) =>
    monitors.find((monitor) => isSpecificMonitor(monitor, key)),
  );
}

export async function getZoomFactor(key: MonitorKey): Promise<number> {
  return findMonitor(key).then(
    (monitor) => monitor?.defaultZoomLevel ?? DEFAULT_ZOOM_LEVEL,
  );
}

export function getPatternFromUrl(url: string): string {
  const origin = new URL(url).origin;

  const isLocalhost = origin.startsWith("http://localhost:");
  if (isLocalhost) {
    return "http://localhost/*";
  }

  return origin + "/*";
}
