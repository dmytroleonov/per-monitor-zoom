import browser from "webextension-polyfill";
import {
  DEFAULT_ZOOM_LEVEL,
  messageTypes,
  MONITORS_KEY,
  type MessageType,
} from "./constants";
import type { Message, Monitor, MonitorKey } from "./types";

export function isMessage(msg: unknown): msg is Message {
  return messageTypes.includes((msg as { type?: string })?.type as MessageType);
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
