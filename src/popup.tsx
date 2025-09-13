import { createEffect, createSignal, For, onMount } from "solid-js";
import type { Monitor, MonitorKey } from "./types";
import {
  getMonitorKey,
  getMonitors,
  isSpecificMonitor,
  saveMonitors,
} from "./utils";
import { DEFAULT_ZOOM_LEVEL, ZOOM_LEVELS } from "./constants";

export function Popup() {
  const [monitors, setMonitors] = createSignal<Monitor[]>([]);

  onMount(async () => {
    const storedMonitors = await getMonitors();
    setMonitors(storedMonitors);
    createEffect(async () => {
      await saveMonitors(monitors());
    });
  });

  const addCurrentMonitor = async (): Promise<void> => {
    const { width, height } = window.screen;

    const exists = monitors().some((monitor) =>
      isSpecificMonitor(monitor, { width, height }),
    );
    if (exists) {
      return;
    }
    setMonitors([
      ...monitors(),
      { width, height, defaultZoomLevel: DEFAULT_ZOOM_LEVEL },
    ]);
  };

  const changeDefaultZoomLevel = (
    key: MonitorKey,
    newDefaultZoomLevel: number,
  ): void => {
    setMonitors((prev) =>
      prev.map((monitor) =>
        isSpecificMonitor(monitor, key)
          ? { ...monitor, defaultZoomLevel: newDefaultZoomLevel }
          : monitor,
      ),
    );
  };

  const removeMonitor = (key: MonitorKey): void => {
    setMonitors((prev) =>
      prev.filter((monitor) => !isSpecificMonitor(monitor, key)),
    );
  };

  return (
    <div style={{ width: "fit-content" }}>
      <button
        onClick={addCurrentMonitor}
        style={{
          "margin-bottom": "4px",
          "white-space": "nowrap",
        }}
      >
        Add current monitor
      </button>
      <div style={{ display: "flex", "flex-direction": "column", gap: "4px" }}>
        <For each={monitors()} fallback={<p>No monitors detected</p>}>
          {(monitor) => (
            <div
              style={{ display: "flex", "align-items": "center", gap: "4px" }}
            >
              {monitor.width}x{monitor.height}
              <select
                value={monitor.defaultZoomLevel}
                onChange={(e) =>
                  changeDefaultZoomLevel(
                    getMonitorKey(monitor),
                    +e.target.value,
                  )
                }
              >
                <For each={ZOOM_LEVELS}>
                  {(zoomLevel) => (
                    <option value={zoomLevel}>{zoomLevel}</option>
                  )}
                </For>
              </select>
              <button onClick={() => removeMonitor(monitor)}>Remove</button>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
