import Transport from "@ledgerhq/hw-transport";
import { LocalTracer, TraceContext } from "@ledgerhq/logs";
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
import { getEnv } from "@ledgerhq/live-env";
import type { SocketEvent } from "@ledgerhq/types-live";

const LOG_TYPE = "socket";
const ALLOW_SECURE_CHANNEL_DELAY = 500;

const warningsSubject = new Subject<string>();
export const warnings: Observable<string> = warningsSubject.asObservable();

/**
 * use Ledger WebSocket API to exchange data with the device
 * Returns an Observable of the final result
 */
export function createDeviceSocket(
  transport: Transport,
  {
    url,
    unresponsiveExpectedDuringBulk,
    context,
  }: {
    url: string;
    unresponsiveExpectedDuringBulk?: boolean;
    context?: TraceContext;
  },
): Observable<SocketEvent> {
  const tracer = new LocalTracer(LOG_TYPE, {
    ...context,
    function: "createDeviceSocket",
    transportContext: transport.getTraceContext(),
  });
  tracer.trace("Starting web socket communication", { url, unresponsiveExpectedDuringBulk });

  return new Observable(o => {
    let deviceError: Error | null = null; // error originating from device (connection/response/rejection...)
    let unsubscribed = false; // subscriber wants to stops everything
    let bulkSubscription: null | { unsubscribe: () => void } = null; // subscription to the bulk observable
    let correctlyFinished = false; // the socket logic reach a normal termination
    let inBulkMode = false; // we have an array of apdus to exchange, without the need of more WS messages.
    let allowSecureChannelTimeout: NodeJS.Timeout | null = null; // allows to delay/cancel the user confirmation event
    const ws = new WS(url);

    ws.onopen = () => {
      tracer.trace("Socket opened", { url });
      o.next({
        type: "opened",
      });
    };

    ws.onerror = e => {
      tracer.trace("Socket error", { e });
      if (inBulkMode) return; // in bulk case, we ignore any network events because we just need to unroll APDUs with the device

      o.error(
        new WebsocketConnectionError(e.message, {
          url,
        }),
      );
    };

    ws.onclose = () => {
      tracer.trace("Socket closed", { url, inBulkMode, correctlyFinished });
      if (inBulkMode) return; // in bulk case, we ignore any network events because we just need to unroll APDUs with the device

      if (correctlyFinished) {
        o.complete();
      } else {
        tracer.trace(`Socket closed, not correctly finished, device error: ${deviceError}`, {
          deviceError,
          inBulkMode,
        });
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
        tracer.trace("Socket in", { type: input.query });

        switch (input.query) {
          case "exchange": {
            tracer.trace("Socket in: exchange", {
              nonce: input?.nonce,
              uuid: input?.uuid,
              session: input?.session,
            });
            // A single ping-pong apdu with the HSM
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

            tracer.trace("Socket out", { response: msg.response });
            const strMsg = JSON.stringify(msg);
            ws.send(strMsg);
            break;
          }

          case "bulk": {
            tracer.trace("Socket in: bulk", {
              apduCount: input?.data?.length,
              nonce: input?.nonce,
              uuid: input?.uuid,
              session: input?.session,
            });

            // In bulk, a lot of APDUs will be unrolled, and the web socket is no longer needed
            inBulkMode = true;
            ws.close();

            const { data } = input;

            const notify = index =>
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
              // if the bulk payload includes trailing empty strings we end up
              // sending empty data to the device and causing a disconnect.
              const cleanData = data
                .map(d => (d !== "" ? Buffer.from(d, "hex") : null))
                .filter(Boolean);

              // we also use a subscription to be able to cancel the bulk if the user unsubscribes
              bulkSubscription = transport.exchangeBulk(cleanData, {
                next: () => {
                  notify(++i);
                },
                error: e => reject(e),
                complete: () => resolve(null),
              });
            });
            if (unsubscribed) {
              tracer.trace("unsubscribed before end of bulk");
              return;
            }

            correctlyFinished = true;
            o.complete();
            break;
          }

          case "success": {
            // A final success event with some data payload
            const payload = input.result || input.data;

            tracer.trace("Socket in: success", {
              payload,
              inBulkMode,
              nonce: input?.nonce,
              uuid: input?.uuid,
              session: input?.session,
            });

            // Once entered in bulk mode, we close the websocket and don't react to any other messages
            if (inBulkMode) break;

            if (payload) {
              o.next({
                type: "result",
                payload,
              });
            }
            correctlyFinished = true;
            o.complete();
            break;
          }

          case "error": {
            tracer.trace("Socket in: error", {
              errorData: input?.data,
              inBulkMode,
              nonce: input?.nonce,
              uuid: input?.uuid,
              session: input?.session,
            });

            // Once entered in bulk mode, we close the websocket and don't react to any other messages
            if (inBulkMode) break;

            // An error from HSM
            throw new DeviceSocketFail(input.data, {
              url,
            });
          }

          case "warning": {
            tracer.trace("Socket in: warning", {
              warningData: input?.data,
              inBulkMode,
              nonce: input?.nonce,
              uuid: input?.uuid,
              session: input?.session,
            });

            // Once entered in bulk mode, we close the websocket and don't react to any other messages
            if (inBulkMode) break;

            // A warning from HSM
            o.next({
              type: "warning",
              message: input.data,
            });
            warningsSubject.next(input.data);
            break;
          }

          default:
            tracer.trace("Socket in: cannot handle msg of type", { input });
        }
      } catch (err: any) {
        deviceError = err;
        tracer.trace("Socket message error", { err });
        o.error(err);
      }
    };

    const onDisconnect = e => {
      transport.off("disconnect", onDisconnect);

      tracer.trace(
        `Socket disconnected. Emitting a DisconnectedDeviceDuringOperation. Error: ${e}`,
        { error: e },
      );
      const error = new DisconnectedDeviceDuringOperation((e && e.message) || "");
      deviceError = error;
      o.error(error);
    };

    const onUnresponsiveDevice = () => {
      tracer.trace(`Device unresponsive`, {
        inBulkMode,
        unresponsiveExpectedDuringBulk,
        allowSecureChannelTimeout,
        unsubscribed,
      });

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
}
