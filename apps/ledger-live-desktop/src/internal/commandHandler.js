// @flow
import { serializeError } from "@ledgerhq/errors";
import { commandsById } from "./commands";
import logger from "../logger";
import { getSentryIfAvailable } from "~/sentry/internal";

const subscriptions = {};

function inferSentryTransaction(cmd, command) {
  const value = cmd.inferSentryTransaction ? cmd.inferSentryTransaction(command.data) : null;
  if (!value) return;
  const { id } = command;
  return getSentryIfAvailable()?.startTransaction({
    op: "command",
    name: id,
    ...value,
  });
}

export function writeToCommand(command: *, send: *) {
  const { data, requestId } = command;
  const subject = subscriptions[requestId];
  subject.next(data);
}

export function completeCommand(command: *, send: *) {
  const { requestId } = command;
  const subject = subscriptions[requestId];
  subject.complete();
}

export function executeCommand(command: *, send: *) {
  const { data, requestId, id } = command;
  const cmd = commandsById[id];
  if (!cmd) {
    logger.warn(`command ${id} not found`);
    return;
  }
  const sentryTransaction = inferSentryTransaction(cmd, command);
  if (sentryTransaction) {
    getSentryIfAvailable()?.configureScope(scope => {
      scope.setSpan(sentryTransaction);
    });
  }
  const startTime = Date.now();
  logger.onCmd("cmd.START", id, 0, data);
  try {
    subscriptions[requestId] = cmd(data); // Store the subject returned instead of the subscription
    subscriptions[requestId].subscribe({
      next: data => {
        if (data?.type === "input-frame") return; // TODO Input can't be treated as output too
        logger.onCmd("cmd.NEXT", id, Date.now() - startTime, data);
        send({ type: "cmd.NEXT", requestId, data });
      },
      complete: () => {
        delete subscriptions[requestId];
        logger.onCmd("cmd.COMPLETE", id, Date.now() - startTime);
        send({ type: "cmd.COMPLETE", requestId });
        sentryTransaction?.finish();
      },
      error: error => {
        logger.warn("Command error:", { error });
        delete subscriptions[requestId];
        logger.onCmd("cmd.ERROR", id, Date.now() - startTime, error);
        send({ type: "cmd.ERROR", requestId, data: serializeError(error) });
        sentryTransaction?.setStatus("internal_error");
      },
    });
  } catch (error) {
    logger.warn("Command impl error:", { error });
    delete subscriptions[requestId];
    logger.onCmd("cmd.ERROR", id, Date.now() - startTime, error);
    send({ type: "cmd.ERROR", requestId, data: serializeError(error) });
    sentryTransaction?.setStatus("unknown");
    sentryTransaction?.finish();
  }
}

export function unsubscribeCommand(requestId: string) {
  const sub = subscriptions[requestId];
  if (sub) {
    sub.unsubscribe();
    delete subscriptions[requestId];
  }
}

export function unsubscribeAllCommands() {
  for (const k in subscriptions) {
    logger.debug("unsubscribeAllCommands: unsubscribe " + k);
    const sub = subscriptions[k];
    sub.unsubscribe();
    delete subscriptions[k];
  }
}
