import { createSignal } from "solid-js";

export function Popup() {
  const [count, setCount] = createSignal(0);

  return (
    <div style={{ width: "200px", height: "100px" }}>
      <button onClick={() => setCount((count) => count + 1)}>
        count is {count()}
      </button>
    </div>
  );
}
