/*
  This file is bundled in to the preload bundle. It get loaded and executed before the renderer bundle.
  The renderer is context-isolated: only what goes through `expose` is visible to it.

  /!\ Everything done in this file must be safe, it can not afford to crash. /!\
*/

import { ipcRenderer } from "electron";
import { palettes } from "@ledgerhq/react-ui/styles/index";
import { installBridge } from "./bridge";
import { expose } from "./bridge/expose";
import { CHANNELS } from "~/bridge/contract";

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
const reloadRenderer = () => ipcRenderer.invoke(CHANNELS.reloadRenderer);

const params = new URLSearchParams(window.location.search);

// cf. https://gist.github.com/codebytere/409738fcb7b774387b5287db2ead2ccb
// When domains is provided (and non-empty), main process will enforce manifest domain whitelist on webview navigation
const openWindow = (id: number, domains?: string[]) =>
  ipcRenderer.send(CHANNELS.webviewDomReady, id, domains);

// Not `window.api = …`: that would land in the preload's own world.
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
ipcRenderer.send(CHANNELS.setBackgroundColor, palette.background.default);

window.addEventListener("DOMContentLoaded", () => {
  // Send ready-to-show immediately
  setTimeout(() => {
    ipcRenderer.send(CHANNELS.readyToShow, {});
  }, 200);
});
