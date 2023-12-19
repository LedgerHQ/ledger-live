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
let sentryEnabled: boolean | undefined;
let userId: string | undefined;
let sentryTags: string | undefined;

const internal = new InternalProcess({
  timeout: 3000,
});

const inMemoryLogger = InMemoryLogger.getLogger();
const consoleLogger = ConsoleLogger.getLogger();

export function getSentryEnabled(): boolean | undefined {
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

function serializedEnvs(envs: Record<string, unknown>): Record<string, string> {
  const serialized: Record<string, string> = {};
  for (const key in envs) {
    const value = envs[key];
    serialized[key] = String(value);
  }
  return serialized;
}

const spawnCoreProcess = () => {
  const env = {
    ...serializedEnvs(getAllEnvs()),
    ...process.env,
    IS_INTERNAL_PROCESS: "1",
    LEDGER_CONFIG_DIRECTORY,
    HOME_DIRECTORY,
    INITIAL_SENTRY_TAGS: sentryTags,
    INITIAL_SENTRY_ENABLED: String(!!sentryEnabled),
    SENTRY_USER_ID: userId,
  };

  internal.configure(path.resolve(__dirname, "main.bundle.js"), [], {
    silent: true,
    env,
    // Passes a list of env variables set on `LEDGER_INTERNAL_ARGS` to the internal process
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
    // Enables updating at runtime the settings of logs printed on stdout
    if (name === "VERBOSE") {
      consoleLogger.refreshSetup();
    }

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

/**
 * Factory creating a request/response handler on requests from the renderer process that are sent to the internal process.
 *
 * The handler routes a (request) message from the renderer process to the internal process,
 * and sets a handler to receive the response from the internal process and reply it to the renderer process
 * Only 1 response from the internal process is expected.
 *
 * @param channel the channel name to create the handler for
 */
const internalHandlerPromise = (channel: string) => {
  ipcMain.on(channel, (event, { data, requestId }) => {
    // Channel to send response to the renderer process
    const replyChannel = `${channel}_RESPONSE_${requestId}`;

    const responseHandler = (message: FromInternalMessage) => {
      // Only handles a response associated to the current request
      if (message.type === channel && message.requestId === requestId) {
        if (message.error) {
          // Sends back the error to the renderer process which will trigger a reject
          event.reply(replyChannel, {
            error: message.error,
          });
        } else {
          // Sends back the response to the renderer process which will trigger a resolve
          event.reply(replyChannel, {
            data: message.data,
          });
        }

        internal.process?.removeListener("message", responseHandler);
      }
    };

    // Listens to response from the internal process
    internal.process?.on("message", responseHandler);

    internal.send({
      type: channel,
      data,
      requestId,
    } as ToInternalMessage);
  });
};

/**
 * Factory creating an "observable" handler on requests from the renderer process that are sent to the internal process.
 *
 * Multi events version of `internalHandlerPromise`:
 * One request and listening to several response/event until an error or a complete is received from the internal process.
 */
const internalHandlerObservable = (channel: string) => {
  ipcMain.on(channel, (event, { data, requestId }) => {
    // Channel to send response to the renderer process
    const replyChannel = `${channel}_RESPONSE_${requestId}`;

    const responsesHandler = (message: FromInternalMessage) => {
      // Only handles responses associated to the current request
      if (message.type === channel && message.requestId === requestId) {
        if (message.error) {
          // Sends back the error to the renderer process which will be considered an error event
          event.reply(replyChannel, {
            error: message.error,
          });
        } else if (message.data) {
          // Sends back the response to the renderer process which will be considered a next event
          event.reply(replyChannel, {
            data: message.data,
          });
        } else {
          // Sends back an empty response to the renderer process which will be considered a complete event
          event.reply(replyChannel, {});

          internal.process?.removeListener("message", responsesHandler);
        }
      }
    };

    // Listens to responses from the internal process
    internal.process?.on("message", responsesHandler);

    internal.send({
      type: channel,
      data,
      requestId,
    } as ToInternalMessage);
  });
};

/**
 * Factory creating an handler on one-way message from the renderer process that are sent to the internal process.
 *
 * Only routes a (request) message from the renderer process to the internal process.
 * No response from the internal process is expected.
 */
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
