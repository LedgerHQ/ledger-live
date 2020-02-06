// @flow

import type Transport from "@ledgerhq/hw-transport";
import { log } from "@ledgerhq/logs";
import { Observable, Subject } from "rxjs";
import {
  WebsocketConnectionError,
  DeviceSocketFail,
  DisconnectedDeviceDuringOperation,
  TransportStatusError,
  UserRefusedAllowManager,
  ManagerDeviceLockedError
} from "@ledgerhq/errors";
import { cancelDeviceAction } from "../hw/deviceAccess";
import { createWebSocket } from "../network";
import { getEnv } from "../env";
import type { SocketEvent } from "../types/manager";

const warningsSubject = new Subject();
export const warnings: Observable<string> = warningsSubject.asObservable();

const ALLOW_MANAGER_DELAY = 500;
const UNRESPONSIVE_DELAY = 15000;

/**
 * use Ledger WebSocket API to exchange data with the device
 * Returns an Observable of the final result
 */
export const createDeviceSocket = (
  transport: Transport<*>,
  {
    url
  }: {
    url: string
  }
): Observable<SocketEvent> =>
  Observable.create(o => {
    let deviceError = null; // the socket was interrupted by device problem
    let unsubscribed = false; // subscriber wants to stops everything
    let normallyFinished = false; // the socket logic reach a normal termination
    let inBulk = false; // bulk is a mode where we have many apdu to run on device and no longer need the connection

    const ws = createWebSocket(url);

    const unresponsiveLockHandling = () => {
      if (unsubscribed) return;
      o.error(new ManagerDeviceLockedError());
    };

    ws.onopen = () => {
      o.next({ type: "opened" });
      log("socket-opened", url);
    };

    ws.onerror = e => {
      log("socket-error", e.message);
      if (inBulk) return;
      o.error(new WebsocketConnectionError(e.message, { url }));
    };

    ws.onclose = () => {
      log("socket-close");
      if (inBulk) return;
      if (normallyFinished) {
        o.complete();
      } else {
        o.error(new WebsocketConnectionError("closed"));
      }
    };

    ws.onmessage = async e => {
      if (unsubscribed) return;
      try {
        const input = JSON.parse(e.data);
        log("socket-in", input.query, input);
        switch (input.query) {
          case "exchange": {
            // a single ping-pong apdu with the HSM
            const { nonce } = input;
            const apdu = Buffer.from(input.data, "hex");
            o.next({ type: "exchange-before", nonce, apdu });

            // specific logic for detecting allow manager
            let requested = false;
            const timeout =
              apdu.slice(0, 2).toString("hex") === "e051"
                ? setTimeout(() => {
                    if (unsubscribed) return;
                    requested = true;
                    o.next({
                      type: "device-permission-requested",
                      wording: "Allow Ledger Manager"
                    });
                  }, ALLOW_MANAGER_DELAY)
                : setTimeout(unresponsiveLockHandling, UNRESPONSIVE_DELAY);

            const r = await transport.exchange(apdu);
            clearTimeout(timeout);
            if (unsubscribed) return;
            const status = r.slice(r.length - 2);

            // if allow manager was requested, we either throw if deny or emit accepted
            if (requested) {
              if (status.toString("hex") === "6985") {
                o.error(new UserRefusedAllowManager());
                return;
              }
              o.next({ type: "device-permission-granted" });
            }

            const data = r.slice(0, r.length - 2);
            o.next({ type: "exchange", nonce, apdu, status, data });
            const strStatus = status.toString("hex");
            const msg = {
              nonce,
              response: strStatus === "9000" ? "success" : "error",
              data: data.toString("hex")
            };
            log("socket-out", msg.response);
            const strMsg = JSON.stringify(msg);
            ws.send(strMsg);

            break;
          }

          case "bulk": {
            // in bulk, we just have to unroll a lot of apdus, we no longer need the WS
            inBulk = true;
            ws.close();

            const { data } = input;
            const notify = index =>
              o.next({
                type: "bulk-progress",
                progress: index / data.length,
                index,
                total: data.length
              });

            notify(0);
            let timeout;
            for (let i = 0; i < data.length; i++) {
              timeout = setTimeout(
                unresponsiveLockHandling,
                UNRESPONSIVE_DELAY
              );
              const r = await transport.exchange(Buffer.from(data[i], "hex"));
              clearTimeout(timeout);
              if (unsubscribed) return;
              const status = r.readUInt16BE(r.length - 2);
              if (status !== 0x9000) throw new TransportStatusError(status);
              notify(i + 1);
            }
            normallyFinished = true;
            o.complete();
            break;
          }

          case "success": {
            // a final success event with some data payload
            const payload = input.result || input.data;
            if (payload) o.next({ type: "result", payload });
            normallyFinished = true;
            o.complete();
            break;
          }

          case "error": {
            // an error from HSM
            throw new DeviceSocketFail(input.data, { url });
          }

          case "warning": {
            // a warning from HSM
            o.next({ type: "warning", message: input.data });
            warningsSubject.next(input.data);
            break;
          }

          default:
            console.warn(`Cannot handle msg of type ${input.query}`, {
              query: input.query,
              url
            });
        }
      } catch (err) {
        deviceError = err;
        log("socket-message-error", err.message);
        o.error(err);
      }
    };

    const onDisconnect = e => {
      transport.off("disconnect", onDisconnect);
      const error = new DisconnectedDeviceDuringOperation(
        (e && e.message) || ""
      );
      deviceError = error;
      o.error(error);
    };
    transport.on("disconnect", onDisconnect);

    return () => {
      unsubscribed = true;
      if (!normallyFinished && !deviceError && inBulk) {
        // if it was not normally ended, we might have to flush it
        if (getEnv("DEVICE_CANCEL_APDU_FLUSH_MECHANISM")) {
          cancelDeviceAction(transport);
        }
      }
      if (ws.readyState === 1) {
        // connection still active. we close it (unsubscribe)
        ws.close();
      }
    };
  });
