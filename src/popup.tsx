import { createEffect, createSignal, For, onMount } from "solid-js";
import browser from "webextension-polyfill";

type Monitor = {
  width: number;
  height: number;
  defaultZoomLevel: number;
};

const zoomLevels = [1, 1.5];
const defaultZoomLevel = 1;

export function Popup() {
  const [monitors, setMonitors] = createSignal<Monitor[]>([]);

  onMount(async () => {
    const data = (await browser.storage.local.get("monitors")) as {
      monitors?: Monitor[];
    };
    setMonitors(data.monitors ?? []);
    createEffect(() => {
      browser.storage.local.set({ monitors: monitors() });
    });
  });

  const addCurrentMonitor = async (): Promise<void> => {
    const { width, height } = window.screen;

    const exists = monitors().some(
      (monitor) => monitor.width === width && monitor.height === height,
    );
    if (exists) {
      return;
    }
    setMonitors([...monitors(), { width, height, defaultZoomLevel }]);
  };

  const changeDefaultZoomLevel = (
    monitor: Monitor,
    newDefaultZoomLevel: number,
  ): void => {
    setMonitors(
      monitors().map((m) =>
        m.width === monitor.width && m.height === monitor.height
          ? { ...m, defaultZoomLevel: newDefaultZoomLevel }
          : m,
      ),
    );
  };

  return (
    <div
      style={{
        width: "200px",
        display: "flex",
        "flex-direction": "column",
        gap: "8px",
      }}
    >
      <button onClick={addCurrentMonitor}>Add current monitor</button>
      <div>
        <For each={monitors()} fallback={<p>No monitors detected</p>}>
          {(monitor) => (
            <div>
              {monitor.width}x{monitor.height}
              <select
                value={monitor.defaultZoomLevel}
                onChange={(e) =>
                  changeDefaultZoomLevel(monitor, +e.target.value)
                }
              >
                <For each={zoomLevels}>
                  {(zoomLevel) => (
                    <option value={zoomLevel}>{zoomLevel}</option>
                  )}
                </For>
              </select>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
