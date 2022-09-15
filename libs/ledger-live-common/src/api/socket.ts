import Transport from "@ledgerhq/hw-transport";
import { log } from "@ledgerhq/logs";
import WS from "isomorphic-ws";
import { Observable, Subject } from "rxjs";
import {
  WebsocketConnectionError,
  DeviceSocketFail,
  DisconnectedDeviceDuringOperation,
  TransportStatusError,
  UserRefusedAllowManager,
  ManagerDeviceLockedError,
} from "@ledgerhq/errors";
import { cancelDeviceAction } from "../hw/deviceAccess";
import { getEnv } from "../env";
import type { SocketEvent } from "@ledgerhq/types-live";
const warningsSubject = new Subject<string>();
export const warnings: Observable<string> = warningsSubject.asObservable();
const ALLOW_MANAGER_DELAY = 500;

/**
 * use Ledger WebSocket API to exchange data with the device
 * Returns an Observable of the final result
 */
export const createDeviceSocket = (
  transport: Transport,
  {
    url,
    unresponsiveExpectedDuringBulk,
  }: {
    url: string;
    unresponsiveExpectedDuringBulk?: boolean;
  }
): Observable<SocketEvent> =>
  new Observable((o) => {
    let deviceError: Error | null = null; // the socket was interrupted by device problem

    let unsubscribed = false; // subscriber wants to stops everything

    let correctlyFinished = false; // the socket logic reach a normal termination

    let inBulk = false; // bulk is a mode where we have many apdu to run on device and no longer need the connection

    let timeoutForAllowManager: NodeJS.Timeout | null | number = null; // track if there is an ongoing allow manager step

    const ws = new WS(url);

    ws.onopen = () => {
      log("socket-opened", url);
      o.next({
        type: "opened",
      });
    };

    ws.onerror = (e) => {
      log("socket-error", e.message);
      if (inBulk) return; // in bulk case, we ignore any network events because we just need to unroll APDUs with the device

      o.error(
        new WebsocketConnectionError(e.message, {
          url,
        })
      );
    };

    ws.onclose = () => {
      log("socket-close");
      if (inBulk) return; // in bulk case, we ignore any network events because we just need to unroll APDUs with the device

      if (correctlyFinished) {
        o.complete();
      } else {
        o.error(new WebsocketConnectionError("closed"));
      }
    };

    ws.onmessage = async (e: any) => {
      if (unsubscribed) return;

      try {
        const input = JSON.parse(e.data);
        log("socket-in", input.query, input);

        switch (input.query) {
          case "exchange": {
            // a single ping-pong apdu with the HSM
            const { nonce } = input;
            const apdu = Buffer.from(input.data, "hex");
            o.next({
              type: "exchange-before",
              nonce,
              apdu,
            });
            // specific logic for detecting allow manager
            let allowManagerAwaitingUser = false;

            if (apdu.slice(0, 2).toString("hex") === "e051") {
              timeoutForAllowManager = setTimeout(() => {
                if (unsubscribed) return;
                allowManagerAwaitingUser = true;
                o.next({
                  type: "device-permission-requested",
                  wording: "Ledger Manager",
                });
              }, ALLOW_MANAGER_DELAY);
            }

            const r = await transport.exchange(apdu);

            if (timeoutForAllowManager) {
              // if the exchange is faster than the timeout, we pass through because it's not "awaiting" user action
              clearTimeout(timeoutForAllowManager as number);
              timeoutForAllowManager = null;
            }

            if (unsubscribed) return;
            const status = r.readUInt16BE(r.length - 2);

            // if allow manager was requested, we either throw if deny or emit accepted
            if (allowManagerAwaitingUser) {
              if (status === 0x6985 || status === 0x5501) {
                o.error(new UserRefusedAllowManager());
                return;
              }

              o.next({
                type: "device-permission-granted",
              });
            }

            const data = r.slice(0, r.length - 2);
            o.next({
              type: "exchange",
              nonce,
              apdu,
              status,
              data,
            });
            const msg = {
              nonce,
              response: status === 0x9000 ? "success" : "error",
              data: data.toString("hex"),
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

            const notify = (index) =>
              o.next({
                type: "bulk-progress",
                progress: index / data.length,
                index,
                total: data.length,
              });

            notify(0);

            for (let i = 0; i < data.length; i++) {
              const r = await transport.exchange(Buffer.from(data[i], "hex"));
              if (unsubscribed) return;
              const status = r.readUInt16BE(r.length - 2);
              // any non success intermediary status will interrupt everything
              if (status !== 0x9000) throw new TransportStatusError(status);
              notify(i + 1);
            }

            correctlyFinished = true;
            o.complete();
            break;
          }

          case "success": {
            // a final success event with some data payload
            const payload = input.result || input.data;
            if (payload)
              o.next({
                type: "result",
                payload,
              });
            correctlyFinished = true;
            o.complete();
            break;
          }

          case "error": {
            // an error from HSM
            throw new DeviceSocketFail(input.data, {
              url,
            });
          }

          case "warning": {
            // a warning from HSM
            o.next({
              type: "warning",
              message: input.data,
            });
            warningsSubject.next(input.data);
            break;
          }

          default:
            console.warn(`Cannot handle msg of type ${input.query}`, {
              query: input.query,
              url,
            });
        }
      } catch (err: any) {
        deviceError = err;
        log("socket-message-error", err.message);
        o.error(err);
      }
    };

    const onDisconnect = (e) => {
      transport.off("disconnect", onDisconnect);
      const error = new DisconnectedDeviceDuringOperation(
        (e && e.message) || ""
      );
      deviceError = error;
      o.error(error);
    };

    const onUnresponsiveDevice = () => {
      if (inBulk && unresponsiveExpectedDuringBulk) return; // firmware identifier is blocking in bulk

      if (timeoutForAllowManager) return; // allow manager is not a locked case

      if (unsubscribed) return;
      o.error(new ManagerDeviceLockedError());
    };

    transport.on("disconnect", onDisconnect);
    transport.on("unresponsive", onUnresponsiveDevice);
    return () => {
      unsubscribed = true;
      transport.off("disconnect", onDisconnect);
      transport.off("unresponsive", onUnresponsiveDevice);

      if (!correctlyFinished && !deviceError && inBulk) {
        // if it was not normally ended, we might have to flush it
        if (getEnv("DEVICE_CANCEL_APDU_FLUSH_MECHANISM")) {
          cancelDeviceAction(transport);
        }
      }

      if (ws.readyState === 1) {
        // connection still active. we close it from client (e.g. user unsubscribe)
        ws.close();
      }
    };
  });
