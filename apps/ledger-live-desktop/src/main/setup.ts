import { setEnvUnsafe } from "@shared/env";
import "./env";
import "./live-common-setup-main";
import "./bootstrap";
import "./saveHandlers";
import "./systemHandlers";
import contextMenu from "electron-context-menu";
import { bufferUncaughtErrorMain } from "~/datadog/main";

for (const k in process.env) {
  setEnvUnsafe(k, process.env[k]);
}

process.setMaxListeners(0);

// In production mode, we do not want Electron's default GUI to show the error. Instead we will output to the console.
if (!__DEV__) {
  process.on("uncaughtException", function (error) {
    const stack = error.stack ? error.stack : `${error.name}: ${error.message}`;
    const message = "Uncaught Exception:\n" + stack;
    console.error(message);
    bufferUncaughtErrorMain(error);
  });

  process.on("unhandledRejection", function (reason) {
    const stack = reason instanceof Error ? (reason.stack ?? reason.message) : String(reason);
    console.error("Unhandled Rejection:\n" + stack);
    bufferUncaughtErrorMain(reason);
  });
}

contextMenu({
  showInspectElement: __DEV__,
  showCopyImageAddress: false,
  // TODO: i18n for labels
  labels: {
    cut: "Cut",
    copy: "Copy",
    paste: "Paste",
    copyLink: "Copy Link",
    inspect: "Inspect element",
  },
});
