import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import { ChatApp } from "./components/ChatApp";

const isChatWindow = window.location.hash === "#chat";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {isChatWindow ? <ChatApp /> : <App />}
  </StrictMode>,
);
