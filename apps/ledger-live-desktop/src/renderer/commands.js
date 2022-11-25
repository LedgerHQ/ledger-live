// @flow
import { ipcRenderer } from "electron";
import type { Commands, CommandFn } from "~/internal/commands";
import { v4 as uuidv4 } from "uuid";
import { Subject } from "rxjs";
import logger from "~/logger";
import { deserializeError } from "@ledgerhq/errors";

// Implements command message of (Renderer proc -> Main proc)
type Msg<A> = {
  type: "cmd.NEXT" | "cmd.COMPLETE" | "cmd.ERROR",
  requestId: string,
  data?: A,
};

export function command<Id: $Keys<Commands>>(id: Id): CommandFn<Id> {
  // $FlowFixMe i'm not sure how to prove CommandFn to flow but it works
  return <A>(data: A) => {
    // Returning a Subject instead of an Observable allows for bidirectional
    // data transfer.
    const subject = new Subject();
    const requestId: string = uuidv4();
    const startTime = Date.now();

    function handleCommandEvent(e, msg: Msg<A>) {
      if (requestId !== msg.requestId) return;
      logger.onCmd(msg.type, id, Date.now() - startTime, msg.data);
      switch (msg.type) {
        case "cmd.NEXT":
          if (msg.data) {
            subject.next(msg.data);
          }
          break;

        case "cmd.COMPLETE":
          subject.complete();
          ipcRenderer.removeListener("command-event", handleCommandEvent);
          break;

        case "cmd.ERROR": {
          const error = deserializeError(msg.data);
          subject.error(error);
          ipcRenderer.removeListener("command-event", handleCommandEvent);
          break;
        }

        default:
      }
    }

    // Allow for further input when we receive events on the subject
    subject.subscribe({
      next: data => {
        if (data?.type === "input-frame") {
          // Filter because we would listen to all events otherwise.
          ipcRenderer.send("command-next", { id, data, requestId });
        }
      },
      complete: data => {
        ipcRenderer.send("command-complete", { requestId });
      },
    });

    ipcRenderer.on("command-event", handleCommandEvent);
    ipcRenderer.send("command", { id, data, requestId });
    logger.onCmd("cmd.START", id, 0, data);
    return subject;
  };
}
