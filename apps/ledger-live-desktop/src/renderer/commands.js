// @flow
import { ipcRenderer } from "electron";
import type { Commands, CommandFn } from "~/internal/commands";

import appOpExec from "~/internal/commands/appOpExec";
import firmwarePrepare from "~/internal/commands/firmwarePrepare";
import firmwareMain from "~/internal/commands/firmwareMain";
import firmwareRepair from "~/internal/commands/firmwareRepair";
import flushDevice from "~/internal/commands/flushDevice";
import waitForDeviceInfo from "~/internal/commands/waitForDeviceInfo";
import getLatestFirmwareForDevice from "~/internal/commands/getLatestFirmwareForDevice";
import connectApp from "~/internal/commands/connectApp";
import connectManager from "~/internal/commands/connectManager";
import listApps from "~/internal/commands/listApps";
import installLanguage from "~/internal/commands/installLanguage";
import getAppAndVersion from "~/internal/commands/getAppAndVersion";
import getDeviceInfo from "~/internal/commands/getDeviceInfo";
import signMessage from "~/internal/commands/signMessage";
import staxLoadImage from "~/internal/commands/staxLoadImage";
import getOnboardingStatePolling from "~/internal/commands/getOnboardingStatePolling";
import getGenuineCheckFromDeviceId from "~/internal/commands/getGenuineCheckFromDeviceId";
import getLatestAvailableFirmwareFromDeviceId from "~/internal/commands/getLatestAvailableFirmwareFromDeviceId";

import { v4 as uuidv4 } from "uuid";
import { Observable } from "rxjs";
import logger from "~/logger";
import { deserializeError } from "@ledgerhq/errors";
import { getEnv } from "@ledgerhq/live-common/env";

// Implements command message of (Renderer proc -> Main proc)
type Msg<A> = {
  type: "cmd.NEXT" | "cmd.COMPLETE" | "cmd.ERROR",
  requestId: string,
  data?: A,
};

const commandsOnRenderer = {
  appOpExec,
  firmwarePrepare,
  firmwareMain,
  firmwareRepair,
  flushDevice,
  waitForDeviceInfo,
  getLatestFirmwareForDevice,
  connectApp,
  connectManager,
  listApps,
  installLanguage,
  getAppAndVersion,
  getDeviceInfo,
  signMessage,
  staxLoadImage,
  getOnboardingStatePolling,
  getGenuineCheckFromDeviceId,
  getLatestAvailableFirmwareFromDeviceId,
};

export function command<Id: $Keys<Commands>>(id: Id): CommandFn<Id> {
  if (getEnv("EXPERIMENTAL_EXECUTION_ON_RENDERER") && id in commandsOnRenderer) {
    return commandsOnRenderer[id];
  }
  // $FlowFixMe i'm not sure how to prove CommandFn to flow but it works
  return <A>(data: A) =>
    Observable.create(o => {
      const requestId: string = uuidv4();
      const startTime = Date.now();

      const unsubscribe = () => {
        ipcRenderer.send("command-unsubscribe", { requestId });
        ipcRenderer.removeListener("command-event", handleCommandEvent);
      };

      function handleCommandEvent(e, msg: Msg<A>) {
        if (requestId !== msg.requestId) return;
        logger.onCmd(msg.type, id, Date.now() - startTime, msg.data);
        switch (msg.type) {
          case "cmd.NEXT":
            if (msg.data) {
              o.next(msg.data);
            }
            break;

          case "cmd.COMPLETE":
            o.complete();
            ipcRenderer.removeListener("command-event", handleCommandEvent);
            break;

          case "cmd.ERROR": {
            const error = deserializeError(msg.data);
            o.error(error);
            ipcRenderer.removeListener("command-event", handleCommandEvent);
            break;
          }

          default:
        }
      }

      ipcRenderer.on("command-event", handleCommandEvent);

      ipcRenderer.send("command", { id, data, requestId });

      logger.onCmd("cmd.START", id, 0, data);

      return unsubscribe;
    });
}
