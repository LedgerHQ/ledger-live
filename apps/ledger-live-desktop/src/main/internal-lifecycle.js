// @flow
import { app, ipcMain } from "electron";
import path from "path";
import { setEnvUnsafe, getAllEnvs } from "@ledgerhq/live-common/env";
import { isRestartNeeded } from "~/helpers/env";
import { setTags } from "~/sentry/main";
import logger from "~/logger";
import { getMainWindow } from "./window-lifecycle";
import InternalProcess from "./InternalProcess";

// ~~~ Local state that main thread keep

const hydratedPerCurrency = {};

// ~~~

const LEDGER_CONFIG_DIRECTORY = app.getPath("userData");
const HOME_DIRECTORY = app.getPath("home");

const internal = new InternalProcess({ timeout: 3000 });

let sentryEnabled = null;
let userId = null;
let sentryTags = null;

export function getSentryEnabled(): boolean | null {
  return sentryEnabled;
}

export function setUserId(id: string) {
  userId = id;
}

ipcMain.handle("set-sentry-tags", (event, tags) => {
  setTags(tags);
  const tagsJSON = JSON.stringify(tags);
  sentryTags = tagsJSON;
  internal.send({
    type: "set-sentry-tags",
    tagsJSON,
  });
});

const spawnCoreProcess = () => {
  const env = {
    ...getAllEnvs(),
    // $FlowFixMe
    ...process.env,
    IS_INTERNAL_PROCESS: 1,
    LEDGER_CONFIG_DIRECTORY,
    HOME_DIRECTORY,
    INITIAL_SENTRY_TAGS: sentryTags,
    INITIAL_SENTRY_ENABLED: String(!!sentryEnabled),
    SENTRY_USER_ID: userId,
  };

  internal.configure(path.resolve(__dirname, "main.bundle.js"), [], {
    env,
    execArgv: (process.env.LEDGER_INTERNAL_ARGS || "").split(/[ ]+/).filter(Boolean),
    silent: true,
  });
  internal.start();
};

internal.onStart(() => {
  internal.process.on("message", handleGlobalInternalMessage);

  internal.send({
    type: "init",
    hydratedPerCurrency,
  });
});

app.on("window-all-closed", async () => {
  logger.info("cleaning internal because main is done");
  if (internal.active) {
    await internal.stop();
  }
  app.quit();
});

ipcMain.on("clean-processes", async () => {
  logger.info("cleaning processes on demand");
  if (internal.active) {
    await internal.stop();
  }
  spawnCoreProcess();
});

const ongoing = {};

internal.onMessage(message => {
  const event = ongoing[message.requestId];
  if (event) {
    event.reply("command-event", message);

    if (message.type === "cmd.ERROR" || message.type === "cmd.COMPLETE") {
      delete ongoing[message.requestId];
    }
  }
});

internal.onExit((code, signal, unexpected) => {
  if (unexpected) {
    Object.keys(ongoing).forEach(requestId => {
      const event = ongoing[requestId];
      event.reply("command-event", {
        type: "cmd.ERROR",
        requestId,
        data: {
          message:
            code !== null
              ? `Internal process error (${code})`
              : `Internal process killed by signal (${signal})`,
          name: "InternalError",
        },
      });
    });
  }
});

ipcMain.on("command", (event, command) => {
  ongoing[command.requestId] = event;
  internal.send({ type: "command", command });
});

ipcMain.on("command-next", (event, command) => {
  ongoing[command.requestId] = event;
  internal.send({ type: "command-next", command });
});

ipcMain.on("command-complete", (event, command) => {
  ongoing[command.requestId] = event;
  internal.send({ type: "command-complete", command });
});

ipcMain.on("command-unsubscribe", (event, { requestId }) => {
  delete ongoing[requestId];
  internal.send({ type: "command-unsubscribe", requestId });
});

function handleGlobalInternalMessage(payload) {
  switch (payload.type) {
    case "uncaughtException": {
      // FIXME
      // const err = deserializeError(payload.error)
      // captureException(err)
      break;
    }
    case "setDeviceBusy": {
      const win = getMainWindow && getMainWindow();
      if (!win) {
        logger.warn(`can't ${payload.type} because no renderer`);
        return;
      }
      win.webContents.send(payload.type, payload);
      break;
    }
    default:
  }
}

ipcMain.on("sentryLogsChanged", (event, payload) => {
  sentryEnabled = payload;
  const p = internal.process;
  if (!p) return;
  p.send({ type: "sentryLogsChanged", payload });
});

ipcMain.on("internalCrashTest", () => {
  const p = internal.process;
  if (!p) return;
  p.send({ type: "internalCrashTest" });
});

ipcMain.on("setEnv", async (event, env) => {
  const { name, value } = env;

  if (setEnvUnsafe(name, value)) {
    if (isRestartNeeded(name)) {
      if (internal.active) {
        await internal.stop();
      }
      spawnCoreProcess();
    } else {
      internal.send({ type: "setEnv", env });
    }
  }
});

ipcMain.on("hydrateCurrencyData", (event, { currencyId, serialized }) => {
  if (hydratedPerCurrency[currencyId] === serialized) return;
  hydratedPerCurrency[currencyId] = serialized;

  internal.send({ type: "hydrateCurrencyData", serialized, currencyId });
});
