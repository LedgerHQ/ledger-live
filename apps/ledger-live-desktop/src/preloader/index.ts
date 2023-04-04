/*
  This file is bundled in to the preload bundle. It get loaded and executed before the renderer bundle.
  Everything set in the window scope will be available for the code that live in the renderer bundle.
  Node API can be reached by the renderer bundle through a proxy define here, even if its nodeIntegration flag is off.

  /!\ Everything done in this file must be safe, it can not afford to crash. /!\
*/

import { ipcRenderer } from "electron";
import * as remote from "@electron/remote";
import logo from "./logo.svg";
import palettes from "~/renderer/styles/palettes";
const appLoaded = () => {
  setTimeout(() => {
    const rendererNode = document.getElementById("react-root");
    const loaderContainer = document.getElementById("loader-container");
    if (rendererNode && loaderContainer) {
      rendererNode.style.visibility = "visible";
      requestAnimationFrame(() => {
        loaderContainer.classList.add("loaded");
        setTimeout(() => {
          loaderContainer.remove();
        }, 3000);
      });
    }
  }, 2000);
};
const reloadRenderer = () => ipcRenderer.invoke("reloadRenderer");

// cf. https://gist.github.com/codebytere/409738fcb7b774387b5287db2ead2ccb
const openWindow = id => ipcRenderer.send("webview-dom-ready", id);
window.api = {
  appLoaded,
  reloadRenderer,
  openWindow,
};

/**
 * This param "theme" that we are using is set in the main thread,
 * in the main/window-lifecycle.js function loadWindow()
 */
const theme = new URLSearchParams(window.location.search).get("theme");
const osTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
const palette = palettes[theme && theme !== "null" ? theme : osTheme] || palettes.dark;
remote.getCurrentWindow().setBackgroundColor(palette.background.default);
window.addEventListener("DOMContentLoaded", () => {
  const imgNode = (document.getElementById("loading-logo") as any) as HTMLImageElement;
  const loaderContainer = document.getElementById("loader-container");
  if (imgNode && loaderContainer) {
    imgNode.src = logo;
    loaderContainer.style.backgroundColor = "#000000";
    loaderContainer.classList.add("loading");
  }
  setTimeout(() => {
    ipcRenderer.send("ready-to-show", {});
  }, 200);
});
