import { app, ipcMain } from "electron";
import path from "path";
import { setEnvUnsafe, getAllEnvs } from "@ledgerhq/live-env";
import { isRestartNeeded } from "~/helpers/env";
import { setTags } from "~/sentry/main";
import InternalProcess, { InternalMessage as FromInternalMessage } from "./InternalProcess";
import {
  transportCloseChannel,
  transportExchangeChannel,
  transportExchangeBulkChannel,
  transportOpenChannel,
  transportExchangeBulkUnsubscribeChannel,
  transportListenChannel,
  transportListenUnsubscribeChannel,
} from "~/config/transportChannels";
import { Message as ToInternalMessage } from "~/internal/types";
import { ConsoleLogger, InMemoryLogger, isALog } from "./logger";

// ~~~

const LEDGER_CONFIG_DIRECTORY = app.getPath("userData");
const HOME_DIRECTORY = app.getPath("home");
let sentryEnabled: boolean | null = null;
let userId: string | null = null;
let sentryTags: string | null = null;

const internal = new InternalProcess({
  timeout: 3000,
});

const inMemoryLogger = InMemoryLogger.getLogger();
const consoleLogger = ConsoleLogger.getLogger();

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
    // @ts-expect-error Some envs are not typed as strings…
    env,
    // Passes a list of env variables set on `LEDGER_INTERNAL_ARGS` to the internal thread
    execArgv: (process.env.LEDGER_INTERNAL_ARGS || "").split(/[ ]+/).filter(Boolean),
  });
  internal.start();
};

internal.onStart(() => {
  internal.process?.on("message", handleGlobalInternalMessage);
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

const ongoing: Record<string, Electron.IpcMainEvent> = {};

// Sets up callback on messages coming from the internal process
internal.onMessage(message => {
  if (message.type === "log:log") {
    if (!message.data || !isALog(message.data)) {
      console.error(`Log not in correct format: ${JSON.stringify(message.data)}`);
    } else {
      inMemoryLogger.log(message.data);
      consoleLogger.log(message.data);
    }

    return;
  }

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

/* The following handlers seem to be unused. */
/* TODO: confim and remove. */

// ipcMain.on("command", (event, command) => {
//   ongoing[command.requestId] = event;
//   internal.send({
//     type: "command",
//     command,
//   });
// });
// ipcMain.on("command-unsubscribe", (event, { requestId }) => {
//   delete ongoing[requestId];
//   internal.send({
//     type: "command-unsubscribe",
//     requestId,
//   });
// });

function handleGlobalInternalMessage(payload: { type: string }) {
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

// Routes a (request) message from the renderer process to the internal process,
// and sets a handler to receive the response from the internal thread and reply it to the renderer process
// Only 1 response from the internal process is expected.
const internalHandlerPromise = (channel: string) => {
  ipcMain.on(channel, (event, { data, requestId }) => {
    const replyChannel = `${channel}_RESPONSE_${requestId}`;
    const handler = (message: FromInternalMessage) => {
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
        internal.process?.removeListener("message", handler);
      }
    };
    internal.process?.on("message", handler);
    internal.send({
      type: channel,
      data,
      requestId,
    } as ToInternalMessage);
  });
};

// Multi event version of internalHandlerPromise:
// Several response from the internal process can be expected
const internalHandlerObservable = (channel: string) => {
  ipcMain.on(channel, (event, { data, requestId }) => {
    const replyChannel = `${channel}_RESPONSE_${requestId}`;
    const handler = (message: FromInternalMessage) => {
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
          internal.process?.removeListener("message", handler);
        }
      }
    };
    internal.process?.on("message", handler);
    internal.send({
      type: channel,
      data,
      requestId,
    } as ToInternalMessage);
  });
};

// Only routes a (request) message from the renderer process to the internal process
// No response from the internal process is expected.
const internalHandlerEvent = (channel: string) => {
  ipcMain.on(channel, (event, { data, requestId }) => {
    internal.send({
      type: channel,
      data,
      requestId,
    } as ToInternalMessage);
  });
};

internalHandlerPromise(transportOpenChannel);
internalHandlerPromise(transportExchangeChannel);
internalHandlerPromise(transportCloseChannel);
internalHandlerObservable(transportExchangeBulkChannel);
internalHandlerObservable(transportListenChannel);
internalHandlerEvent(transportExchangeBulkUnsubscribeChannel);
internalHandlerEvent(transportListenUnsubscribeChannel);
