/*
  This file is bundled in to the preload bundle. It get loaded and executed before the renderer bundle.
  The renderer runs context-isolated with no Node, so nothing here is visible to it unless it
  goes through `expose` — see ./bridge/expose.

  /!\ Everything done in this file must be safe, it can not afford to crash. /!\
*/

import { ipcRenderer } from "electron";
import { palettes } from "@ledgerhq/react-ui/styles/index";
import { installBridge } from "./bridge";
import { expose } from "./bridge/expose";

// Must be first: the renderer reads bootstrap values at module-evaluation time.
installBridge();

// When dashboard is ready, fade out the splash screen
const appLoaded = () => {
  const rendererNode = document.getElementById("react-root");
  const loaderContainer = document.getElementById("loader-container");

  if (rendererNode && loaderContainer) {
    // Make renderer visible immediately
    rendererNode.style.visibility = "visible";

    // Fade out the loader
    loaderContainer.classList.add("fade-out");
    setTimeout(() => {
      loaderContainer.remove();
    }, 500); // Wait for fade-out animation to complete
  }
};
const reloadRenderer = () => ipcRenderer.invoke("reloadRenderer");

const params = new URLSearchParams(window.location.search);

// cf. https://gist.github.com/codebytere/409738fcb7b774387b5287db2ead2ccb
// When domains is provided (and non-empty), main process will enforce manifest domain whitelist on webview navigation
const openWindow = (id: number, domains?: string[]) =>
  ipcRenderer.send("webview-dom-ready", id, domains);

// A direct `window.api = ...` assignment would land in the preload's own world, invisible
// to the renderer. `appLoaded` still works across the bridge because the DOM is shared.
expose("api", {
  appDirname: params.get("appDirname") || "",
  appLoaded,
  reloadRenderer,
  openWindow,
});

/**
 * This param "theme" that we are using is set in the main thread,
 * in the main/window-lifecycle.js function loadWindow()
 */
const theme = params.get("theme") as "dark" | "light" | "null";
const osTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
const palette = palettes[theme && theme !== "null" ? theme : osTheme] || palettes.dark;
ipcRenderer.send("set-background-color", palette.background.default);

window.addEventListener("DOMContentLoaded", () => {
  // Send ready-to-show immediately
  setTimeout(() => {
    ipcRenderer.send("ready-to-show", {});
  }, 200);
});
