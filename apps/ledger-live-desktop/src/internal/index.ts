import { captureException, getSentryIfAvailable } from "../sentry/internal";
import { unsubscribeSetup } from "./live-common-setup";
import { setEnvUnsafe } from "@ledgerhq/live-env";
import { serializeError } from "@ledgerhq/errors";
import { log, trace } from "@ledgerhq/logs";
import sentry, { setTags } from "~/sentry/internal";
import {
  transportClose,
  transportExchange,
  transportExchangeBulk,
  transportExchangeBulkUnsubscribe,
  transportListen,
  transportListenUnsubscribe,
  transportOpen,
} from "~/internal/transportHandler";
import {
  transportCloseChannel,
  transportExchangeBulkChannel,
  transportExchangeBulkUnsubscribeChannel,
  transportExchangeChannel,
  transportListenChannel,
  transportListenUnsubscribeChannel,
  transportOpenChannel,
} from "~/config/transportChannels";
import { Message } from "./types";
import { LOG_TYPE_INTERNAL } from "./logger";

process.on("exit", () => {
  console.debug("exiting process, unsubscribing all...");
  unsubscribeSetup();
  getSentryIfAvailable()?.close(2000);
});

process.title = "Ledger Live Internal";

process.on("uncaughtException", err => {
  process.send &&
    process.send({
      type: "uncaughtException",
      error: serializeError(err),
    });
  // FIXME we should ideally do this:
  // process.exit(1)
  // but for now, until we kill all exceptions:
  console.error(err, "uncaughtException");
  captureException(err);
});

// eslint-disable-next-line no-unused-vars
let sentryEnabled = process.env.INITIAL_SENTRY_ENABLED !== "false";
const userId = process.env.SENTRY_USER_ID || "";
sentry(() => Boolean(userId) && sentryEnabled, userId);
const { INITIAL_SENTRY_TAGS } = process.env;
if (INITIAL_SENTRY_TAGS) {
  const parsed = JSON.parse(INITIAL_SENTRY_TAGS);
  if (parsed) setTags(parsed);
}

// Handles messages from the `main` process
process.on("message", async (m: Message) => {
  switch (m.type) {
    case transportOpenChannel:
      transportOpen(m).subscribe({
        next: ({ type, ...response }) => {
          process.send?.({
            type: transportOpenChannel,
            requestId: m.requestId,
            ...response,
          });
        },
        error: error => {
          trace({
            type: LOG_TYPE_INTERNAL,
            message: `Unhandled error: ${error}`,
            data: { error },
            context: { function: "transportOpen" },
          });
        },
      });
      break;
    case transportExchangeChannel:
      transportExchange(m).subscribe({
        next: ({ type, ...response }) => {
          process.send?.({
            type: transportExchangeChannel,
            requestId: m.requestId,
            ...response,
          });
        },
        error: error => {
          trace({
            type: LOG_TYPE_INTERNAL,
            message: `Unhandled error: ${error}`,
            data: { error },
            context: { function: "transportExchangeChannel" },
          });
        },
      });

      break;
    case transportExchangeBulkChannel:
      transportExchangeBulk(m).subscribe({
        next: ({ type, ...response }) => {
          process.send?.({
            type: transportExchangeBulkChannel,
            requestId: m.requestId,
            ...response,
          });
        },
        error: error => {
          trace({
            type: LOG_TYPE_INTERNAL,
            message: `Unhandled error: ${error}`,
            data: { error },
            context: { function: "transportExchangeBulk" },
          });
        },
        complete: () => {
          process.send?.({
            type: transportExchangeBulkChannel,
            requestId: m.requestId,
          });
        },
      });

      break;
    case transportExchangeBulkUnsubscribeChannel:
      transportExchangeBulkUnsubscribe(m).subscribe({
        next: ({ type, ...response }) => {
          process.send?.({
            type: transportExchangeBulkChannel,
            requestId: m.requestId,
            ...response,
          });
        },
        error: error => {
          trace({
            type: LOG_TYPE_INTERNAL,
            message: `Unhandled error: ${error}`,
            data: { error },
            context: { function: "transportExchangeBulkUnsubscribe" },
          });
        },
      });

      break;
    case transportListenChannel:
      transportListen(m).subscribe({
        next: ({ type, ...response }) => {
          process.send?.({
            type: transportListenChannel,
            requestId: m.requestId,
            ...response,
          });
        },
        error: error => {
          trace({
            type: LOG_TYPE_INTERNAL,
            message: `Unhandled error: ${error}`,
            data: { error },
            context: { function: "transportListenChannel" },
          });
        },
      });

      break;
    case transportListenUnsubscribeChannel:
      transportListenUnsubscribe(m).subscribe({
        error: error => {
          trace({
            type: LOG_TYPE_INTERNAL,
            message: `Unhandled error: ${error}`,
            data: { error },
            context: { function: "transportListenUnsubscribe" },
          });
        },
      });
      break;
    case transportCloseChannel:
      transportClose(m).subscribe({
        next: ({ type, ...response }) => {
          process.send?.({
            type: transportCloseChannel,
            requestId: m.requestId,
            ...response,
          });
        },
        error: error => {
          trace({
            type: LOG_TYPE_INTERNAL,
            message: `Unhandled error: ${error}`,
            data: { error },
            context: { function: "transportClose" },
          });
        },
      });
      break;
    case "sentryLogsChanged": {
      const { payload } = m;
      sentryEnabled = payload;
      break;
    }
    case "set-sentry-tags": {
      setTags(JSON.parse(m.tagsJSON));
      break;
    }
    case "internalCrashTest": {
      captureException(new Error("CrashTestInternal"));
      break;
    }
    case "setEnv": {
      const { name, value } = m.env;
      setEnvUnsafe(name, value);
      break;
    }
    default:
      log("error", `internal process: '${(m as { type: string }).type}' event not supported`);
  }
});

process.on("disconnect", () => {
  process.exit(0);
});

log("internal", "Internal process is up!");
