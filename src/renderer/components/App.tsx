import "./css/App.css";
import "../../../node_modules/98.css/dist/98.css";
import "./css/98.extended.css";
import "./css/Theme.css";

import { Clippy } from "./Clippy";
import { SharedStateProvider } from "../contexts/SharedStateContext";
import { DebugProvider } from "../contexts/DebugContext";

export function App() {
  return (
    <DebugProvider>
      <SharedStateProvider>
        <div
          className="clippy"
          style={{
            position: "fixed",
            bottom: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "flex-end",
            width: "100%",
            height: "100%",
          }}
        >
          <Clippy />
        </div>
      </SharedStateProvider>
    </DebugProvider>
  );
}
