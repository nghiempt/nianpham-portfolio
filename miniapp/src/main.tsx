import { createRoot } from "react-dom/client";
import { configAppView } from "zmp-sdk/apis";
import appConfig from "../app-settings.json";
import App from "./app";
import "./base.css";

declare global {
  interface Window {
    APP_CONFIG?: unknown;
  }
}

// Zalo reads the app's title bar settings from here.
if (!window.APP_CONFIG) window.APP_CONFIG = appConfig;

// Zalo's default action bar is a solid blue strip; blend it into the page
// instead: same white as the background, dark text, centred title, no back
// button (single screen). app-settings.json sets the same colours up front.
configAppView({
  headerColor: "#ffffff",
  headerTextColor: "black",
  statusBarType: "normal",
  actionBar: { title: "Smart Insight Space", leftButton: "none", textAlign: "center" },
}).catch(() => {
  // Outside Zalo (browser preview) there is no action bar to configure.
});

createRoot(document.getElementById("app")!).render(<App />);
