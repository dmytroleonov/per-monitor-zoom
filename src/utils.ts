import browser from "webextension-polyfill";
import {
  DEFAULT_ZOOM_FACTOR,
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

export function isSameMonitorKey(key1: MonitorKey, key2: MonitorKey): boolean {
  return key1.width === key2.width && key1.height === key2.height;
}

export function isSpecificMonitor(monitor: Monitor, key: MonitorKey): boolean {
  const monitorKey = getMonitorKey(monitor);

  return isSameMonitorKey(monitorKey, key);
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
    (monitor) => monitor?.defaultZoomFactor ?? DEFAULT_ZOOM_FACTOR,
  );
}

function getMonitorOriginKey(key: MonitorKey, origin: string): string {
  const { width, height } = key;

  return `${width}x${height}:${origin}`;
}

async function getZoomFactorByOriginKey(
  key: string,
): Promise<number | undefined> {
  const data = (await browser.storage.local.get(key)) as {
    [key]?: number;
  };

  return data[key];
}

async function setZoomFactorByOriginKey(
  key: string,
  zoomFactor: number,
): Promise<void> {
  await browser.storage.local.set({ [key]: zoomFactor });
}

async function deleteZoomFactorByOriginKey(key: string): Promise<void> {
  await browser.storage.local.remove(key);
}

export async function getZoomFactorByUrl(
  key: MonitorKey,
  url: string,
): Promise<number> {
  const origin = getOrigin(url);
  const originKey = getMonitorOriginKey(key, origin);
  const zoomFactorByOrigin = await getZoomFactorByOriginKey(originKey);
  const defaultZoomFactor = await getZoomFactor(key);

  return zoomFactorByOrigin ?? defaultZoomFactor;
}

export async function setZoomFactorByUrl(
  key: MonitorKey,
  url: string,
  zoomFactor: number,
): Promise<void> {
  const origin = getOrigin(url);
  const originKey = getMonitorOriginKey(key, origin);
  const defaultZoomFactor = await getZoomFactor(key);

  if (zoomFactor === defaultZoomFactor) {
    await deleteZoomFactorByOriginKey(originKey);
    return;
  }

  await setZoomFactorByOriginKey(originKey, zoomFactor);
}

function getOrigin(url: string): string {
  const origin = new URL(url).origin;
  // remove port number
  const match = origin.match(/^(.*?)(:\d+)?$/);

  return match ? match[1] : origin;
}

export function getPatternFromUrl(url: string): string {
  const origin = getOrigin(url);

  return origin + "/*";
}
