import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_VCONSOLE === "true") {
  import("vconsole").then(({ default: VConsole }) => {
    new VConsole({ theme: "dark" });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
