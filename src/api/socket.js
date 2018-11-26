// @flow

import invariant from "invariant";
import type Transport from "@ledgerhq/hw-transport";
import noop from "lodash/noop";
import { Observable } from "rxjs";
import {
  WebsocketConnectionError,
  WebsocketConnectionFailed,
  DeviceSocketFail,
  DeviceSocketNoBulkStatus,
  DeviceSocketNoHandler,
} from "@ledgerhq/live-common/lib/errors";

const log = __DEV__ ? (...arg) => console.log(...arg) : noop; // eslint-disable-line no-console

/**
 * use Ledger WebSocket API to exchange data with the device
 * Returns an Observable of the final result
 */
export const createDeviceSocket = (transport: Transport<*>, url: string) =>
  Observable.create(o => {
    let ws;
    let lastMessage: ?string;
    let interrupted = false;
    let currentDeviceJob: ?Promise<any>;

    try {
      ws = new global.WebSocket(url);
    } catch (err) {
      o.error(new WebsocketConnectionFailed(err.message, { url }));
      return () => {};
    }
    invariant(ws, "websocket is available");

    ws.onopen = () => {
      log("OPENED", { url });
    };

    ws.onerror = e => {
      log("ERROR", { message: e.message, stack: e.stack });
      o.error(new WebsocketConnectionError(e.message, { url }));
    };

    ws.onclose = () => {
      log("CLOSE");
      o.next(lastMessage || "");
      o.complete();
    };

    const send = (nonce, response, data) => {
      const msg = {
        nonce,
        response,
        data,
      };
      log("SEND", msg);
      const strMsg = JSON.stringify(msg);
      ws.send(strMsg);
    };

    const handlers = {
      exchange: async input => {
        const { data, nonce } = input;
        const r: Buffer = await transport.exchange(Buffer.from(data, "hex"));
        if (interrupted) return;
        const status = r.slice(r.length - 2);
        const buffer = r.slice(0, r.length - 2);
        const strStatus = status.toString("hex");
        send(
          nonce,
          strStatus === "9000" ? "success" : "error",
          buffer.toString("hex"),
        );
      },

      bulk: async input => {
        const { data, nonce } = input;

        // Execute all apdus and collect last status
        let lastStatus = null;
        for (const apdu of data) {
          const r: Buffer = await transport.exchange(Buffer.from(apdu, "hex"));
          lastStatus = r.slice(r.length - 2);

          if (lastStatus.toString("hex") !== "9000") break;
          if (interrupted) return;
        }

        if (!lastStatus) {
          throw new DeviceSocketNoBulkStatus();
        }

        const strStatus = lastStatus.toString("hex");

        send(
          nonce,
          strStatus === "9000" ? "success" : "error",
          strStatus === "9000" ? "" : strStatus,
        );
      },

      success: msg => {
        lastMessage = msg.data || msg.result;
        ws.close();
      },

      error: msg => {
        log("ERROR", { data: msg.data });
        throw new DeviceSocketFail(msg.data, { url });
      },
    };

    const stackMessage = async e => {
      if (interrupted) return;
      try {
        const msg = JSON.parse(e.data);
        if (!(msg.query in handlers)) {
          throw new DeviceSocketNoHandler(
            `Cannot handle msg of type ${msg.query}`,
            {
              query: msg.query,
              url,
            },
          );
        }
        log("RECEIVE", msg);
        await handlers[msg.query](msg);
      } catch (err) {
        log("ERROR", { message: err.message, stack: err.stack });
        o.error(err);
      }
    };

    ws.onmessage = rawMsg => {
      currentDeviceJob = stackMessage(rawMsg);
    };

    async function finish() {
      interrupted = true;
      // TODO add a delay
      if (ws.readyState !== 1) return;
      ws.close();
      if (currentDeviceJob) {
        // make sure we wait latest stuff
        await currentDeviceJob.catch(() => {});
      }
      await transport.send(0, 0, 0, 0).catch(() => {}); // send a dummy event just to reset the device state
    }

    return () => {
      finish();
    };
  });
