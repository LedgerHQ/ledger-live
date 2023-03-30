import { app, ipcMain } from "electron";
import path from "path";
import { setEnvUnsafe, getAllEnvs } from "@ledgerhq/live-common/env";
import { isRestartNeeded } from "~/helpers/env";
import { setTags } from "~/sentry/main";
import InternalProcess from "./InternalProcess";
import {
  transportCloseChannel,
  transportExchangeChannel,
  transportExchangeBulkChannel,
  transportOpenChannel,
  transportExchangeBulkUnsubscribeChannel,
  transportListenChannel,
  transportListenUnsubscribeChannel,
} from "~/config/transportChannels";

// ~~~

const LEDGER_CONFIG_DIRECTORY = app.getPath("userData");
const HOME_DIRECTORY = app.getPath("home");
const internal = new InternalProcess({
  timeout: 3000,
});
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

    ...process.env,
    IS_INTERNAL_PROCESS: 1,
    LEDGER_CONFIG_DIRECTORY,
    HOME_DIRECTORY,
    INITIAL_SENTRY_TAGS: sentryTags,
    INITIAL_SENTRY_ENABLED: String(!!sentryEnabled),
    SENTRY_USER_ID: userId,
  };
  internal.configure(path.resolve(__dirname, "main.bundle.js"), [], {
    silent: true,
    env,
    execArgv: (process.env.LEDGER_INTERNAL_ARGS || "").split(/[ ]+/).filter(Boolean),
  });
  internal.start();
};
internal.onStart(() => {
  internal.process.on("message", handleGlobalInternalMessage);
});
app.on("window-all-closed", async () => {
  if (internal.active) {
    await internal.stop();
  }
  app.quit();
});
ipcMain.on("clean-processes", async () => {
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
    if (process.env.CRASH_ON_INTERNAL_CRASH) {
      process.exit(code || 1);
    }
  }
});
ipcMain.on("command", (event, command) => {
  ongoing[command.requestId] = event;
  internal.send({
    type: "command",
    command,
  });
});
ipcMain.on("command-unsubscribe", (event, { requestId }) => {
  delete ongoing[requestId];
  internal.send({
    type: "command-unsubscribe",
    requestId,
  });
});
function handleGlobalInternalMessage(payload) {
  switch (payload.type) {
    case "uncaughtException": {
      // FIXME
      // const err = deserializeError(payload.error)
      // captureException(err)
      break;
    }
    default:
  }
}
ipcMain.on("sentryLogsChanged", (event, payload) => {
  sentryEnabled = payload;
  const p = internal.process;
  if (!p) return;
  p.send({
    type: "sentryLogsChanged",
    payload,
  });
});
ipcMain.on("internalCrashTest", () => {
  const p = internal.process;
  if (!p) return;
  p.send({
    type: "internalCrashTest",
  });
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
      internal.send({
        type: "setEnv",
        env,
      });
    }
  }
});

// route internal process messages to renderer
const internalHandlerPromise = channel => {
  ipcMain.on(channel, (event, { data, requestId }) => {
    const replyChannel = `${channel}_RESPONSE_${requestId}`;
    const handler = message => {
      if (message.type === channel && message.requestId === requestId) {
        if (message.error) {
          // reject
          event.reply(replyChannel, {
            error: message.error,
          });
        } else {
          // resolve
          event.reply(replyChannel, {
            data: message.data,
          });
        }
        internal.process.removeListener("message", handler);
      }
    };
    internal.process.on("message", handler);
    internal.send({
      type: channel,
      data,
      requestId,
    });
  });
};

// multi event version of internalHandler
const internalHandlerObservable = channel => {
  ipcMain.on(channel, (event, { data, requestId }) => {
    const replyChannel = `${channel}_RESPONSE_${requestId}`;
    const handler = message => {
      if (message.type === channel && message.requestId === requestId) {
        if (message.error) {
          // error
          event.reply(replyChannel, {
            error: message.error,
          });
        } else if (message.data) {
          // next
          event.reply(replyChannel, {
            data: message.data,
          });
        } else {
          // complete
          event.reply(replyChannel, {});
          internal.process.removeListener("message", handler);
        }
      }
    };
    internal.process.on("message", handler);
    internal.send({
      type: channel,
      data,
      requestId,
    });
  });
};

// simple event routing
const internalHandlerEvent = channel => {
  ipcMain.on(channel, (event, { data, requestId }) => {
    internal.send({
      type: channel,
      data,
      requestId,
    });
  });
};
internalHandlerPromise(transportOpenChannel);
internalHandlerPromise(transportExchangeChannel);
internalHandlerPromise(transportCloseChannel);
internalHandlerObservable(transportExchangeBulkChannel);
internalHandlerObservable(transportListenChannel);
internalHandlerEvent(transportExchangeBulkUnsubscribeChannel);
internalHandlerEvent(transportListenUnsubscribeChannel);
