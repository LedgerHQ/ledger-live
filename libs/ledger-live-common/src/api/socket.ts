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
  StatusCodes,
} from "@ledgerhq/errors";
import { cancelDeviceAction } from "../hw/deviceAccess";
import { getEnv } from "../env";
import type { SocketEvent } from "@ledgerhq/types-live";
const warningsSubject = new Subject<string>();
export const warnings: Observable<string> = warningsSubject.asObservable();
const ALLOW_SECURE_CHANNEL_DELAY = 500;

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
    let deviceError: Error | null = null; // error originating from device (connection/response/rejection...)
    let unsubscribed = false; // subscriber wants to stops everything
    let bulkSubscription: null | { unsubscribe: () => void } = null; // subscription to the bulk observable
    let correctlyFinished = false; // the socket logic reach a normal termination
    let inBulkMode = false; // we have an array of apdus to exchange, without the need of more WS messages.
    let allowSecureChannelTimeout: NodeJS.Timeout | null = null; // allows to delay/cancel the user confirmation event
    const ws = new WS(url);

    ws.onopen = () => {
      log("socket-opened", url);
      o.next({
        type: "opened",
      });
    };

    ws.onerror = (e) => {
      log("socket-error", e.message);
      if (inBulkMode) return; // in bulk case, we ignore any network events because we just need to unroll APDUs with the device

      o.error(
        new WebsocketConnectionError(e.message, {
          url,
        })
      );
    };

    ws.onclose = () => {
      log("socket-close");
      if (inBulkMode) return; // in bulk case, we ignore any network events because we just need to unroll APDUs with the device

      if (correctlyFinished) {
        o.complete();
      } else {
        // Nb Give priority to the cached error from a device connection, since websocket closes give
        // us no information on what caused the close.
        o.error(deviceError || new WebsocketConnectionError("closed"));
      }
    };

    ws.onmessage = async (e: any) => {
      if (unsubscribed) return;
      deviceError = null; // If we continue to receive messages, the cached error is obsolete.

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

            // Detect the specific exchange that triggers the allow secure channel request.
            let pendingUserAllowSecureChannel = false;

            if (apdu.slice(0, 2).toString("hex") === "e051") {
              pendingUserAllowSecureChannel = true;
              allowSecureChannelTimeout = setTimeout(() => {
                if (unsubscribed) return;
                o.next({
                  type: "device-permission-requested",
                  wording: "Ledger Manager", // TODO make this dynamic per fw version to match device
                });
                // Nb Permission is only requested once per reboot, delaying the event
                // prevents the UI from flashing the rendering for allowing.
              }, ALLOW_SECURE_CHANNEL_DELAY);
            }

            const r = await transport.exchange(apdu);

            if (allowSecureChannelTimeout) {
              clearTimeout(allowSecureChannelTimeout);
              allowSecureChannelTimeout = null;
            }

            if (unsubscribed) return;
            const status = r.readUInt16BE(r.length - 2);

            let response;
            switch (status) {
              case StatusCodes.OK:
                response = "success";
                break;

              case StatusCodes.LOCKED_DEVICE:
                o.error(new TransportStatusError(status));
                return;

              case StatusCodes.USER_REFUSED_ON_DEVICE:
              case StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED:
                if (pendingUserAllowSecureChannel) {
                  o.error(new UserRefusedAllowManager());
                  return;
                }
              // Fallthrough is literally what we want when not allowing a secure channel.
              // eslint-disable-next-line no-fallthrough
              default:
                // Nb Other errors may not throw directly, we will instead keep track of
                // them and throw them if the next event from the ws connection is a disconnect
                // otherwise, we clear them.
                response = "error";
                deviceError = new TransportStatusError(status);
                break;
            }

            if (pendingUserAllowSecureChannel) {
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
              response,
              data: data.toString("hex"),
            };

            log("socket-out", msg.response);
            const strMsg = JSON.stringify(msg);
            ws.send(strMsg);
            break;
          }

          case "bulk": {
            // in bulk, we just have to unroll a lot of apdus, we no longer need the WS
            inBulkMode = true;
            ws.close();
            const { data } = input;

            const notify = (index) =>
              o.next({
                type: "bulk-progress",
                progress: index / data.length,
                index,
                total: data.length,
              });

            // we use a promise to wait for the bulk to finish
            await new Promise((resolve, reject) => {
              let i = 0;
              notify(0);
              // we also use a subscription to be able to cancel the bulk if the user unsubscribes
              bulkSubscription = transport.exchangeBulk(
                data.map((d) => Buffer.from(d, "hex")),
                {
                  next: () => {
                    notify(++i);
                  },
                  error: (e) => reject(e),
                  complete: () => resolve(null),
                }
              );
            });
            if (unsubscribed) {
              log("socket", "unsubscribed before end of bulk");
              return;
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
      // Nb Don't consider the device as locked if we are in a blocking apdu exchange, ie
      // one that requires user confirmation to complete.
      if (inBulkMode && unresponsiveExpectedDuringBulk) return;
      if (allowSecureChannelTimeout) return;

      if (unsubscribed) return;
      o.error(new ManagerDeviceLockedError());
    };

    transport.on("disconnect", onDisconnect);
    transport.on("unresponsive", onUnresponsiveDevice);
    return () => {
      unsubscribed = true;
      if (bulkSubscription) {
        bulkSubscription.unsubscribe();
      }
      transport.off("disconnect", onDisconnect);
      transport.off("unresponsive", onUnresponsiveDevice);

      if (!correctlyFinished && !deviceError && inBulkMode) {
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
