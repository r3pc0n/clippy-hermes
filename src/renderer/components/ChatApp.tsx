import "./css/App.css";
import "../../../node_modules/98.css/dist/98.css";
import "./css/98.extended.css";
import "./css/Theme.css";

import { Bubble } from "./BubbleWindow";
import { ChatProvider } from "../contexts/ChatContext";
import { SharedStateProvider } from "../contexts/SharedStateContext";
import { BubbleViewProvider } from "../contexts/BubbleViewContext";
import { DebugProvider } from "../contexts/DebugContext";

export function ChatApp() {
  return (
    <DebugProvider>
      <SharedStateProvider>
        <ChatProvider>
          <BubbleViewProvider>
            <div
              className="clippy"
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <Bubble />
            </div>
          </BubbleViewProvider>
        </ChatProvider>
      </SharedStateProvider>
    </DebugProvider>
  );
}
