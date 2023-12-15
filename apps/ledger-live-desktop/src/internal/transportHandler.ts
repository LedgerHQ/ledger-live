import { Observable } from "rxjs";
import TransportNodeHidSingleton from "@ledgerhq/hw-transport-node-hid-singleton";
import { open } from "@ledgerhq/live-common/hw/index";
import { DisconnectedDeviceDuringOperation, serializeError } from "@ledgerhq/errors";
import {
  transportCloseChannel,
  transportExchangeBulkUnsubscribeChannel,
  transportListenChannel,
} from "~/config/transportChannels";
import { MessagesMap } from "./types";
import { LocalTracer } from "@ledgerhq/logs";
import { LOG_TYPE_INTERNAL } from "./logger";
import { DeviceId } from "@ledgerhq/types-live";
import Transport from "@ledgerhq/hw-transport";

// Subscriptions to bulk exchanges
const exchangeBulkSubscriptions = new Map<string, { unsubscribe: () => void }>();

// Subscriptions to Transport listen
const transportListenListeners = new Map<string, { unsubscribe: () => void }>();

const transportForDevices = new Map<DeviceId, Transport>();

export type TransportOpenResponse =
  | {
      data: MessagesMap["transport:open"]["data"];
    }
  | {
      error: ReturnType<typeof serializeError>;
    };
export const transportOpen = ({
  data,
  requestId,
}: MessagesMap["transport:open"]): Observable<TransportOpenResponse> => {
  return new Observable(subscriber => {
    const { descriptor, timeoutMs, context } = data;
    const tracer = new LocalTracer(LOG_TYPE_INTERNAL, {
      ipcContext: context,
      requestId,
      function: "transportOpen",
    });
    // TODO: device what to put in tracer context
    tracer.trace("Received open transport request", { descriptor, timeoutMs });

    const existingTransport = transportForDevices.get(descriptor);

    const onEnd = () => {
      subscriber.next({
        data,
      });

      subscriber.complete();
    };

    // If already exists simply return success
    if (existingTransport) {
      tracer.trace("Transport instance already exists for the given descriptor", { descriptor });
      return onEnd();
    }

    // No withDevice or withTransport in the internal process, the transport management
    // is handled in the renderer process. We have a 1 <-> 1 relationship between
    // the IPCTransport in the renderer process, and the opened transport instance here in the internal process.
    open(descriptor, timeoutMs, tracer.getContext())
      .then(transport => {
        transport.on("disconnect", () => {
          tracer.trace("Event disconnect on transport instance. Cleaning cached transport", {
            descriptor,
          });

          // A disconnect event means the transport has been closed
          // We only need to clear the transport from the mapping
          transportForDevices.delete(descriptor);
        });

        transportForDevices.set(data.descriptor, transport);
        onEnd();
      })
      .catch(error => {
        tracer.trace(`Error while opening transport: ${error}`, { error });

        subscriber.next({
          error: serializeError(error as Parameters<typeof serializeError>[0]),
        });
        subscriber.complete();
      });
  });
};

export type TransportExchange =
  | {
      data: string;
    }
  | {
      error: ReturnType<typeof serializeError>;
    };
export const transportExchange = ({
  data,
  requestId,
}: MessagesMap["transport:exchange"]): Observable<TransportExchange> => {
  return new Observable(subscriber => {
    const tracer = new LocalTracer(LOG_TYPE_INTERNAL, {
      requestId,
      function: "transportExchange",
    });
    tracer.trace("transport:exchange message received", { data });

    const { descriptor, apduHex, abortTimeoutMs, context } = data;
    const transport = transportForDevices.get(descriptor);

    if (!transport) {
      tracer.trace("No open transport for the given descriptor");

      subscriber.next({
        error: serializeError(
          new DisconnectedDeviceDuringOperation("No open transport for the given descriptor"),
        ),
      });
      subscriber.complete();
      return;
    }

    // TODO: is it a good place to update the transport context ?
    transport.updateTraceContext({ ipcContext: { context }, requestId });

    transport
      .exchange(Buffer.from(apduHex, "hex"), { abortTimeoutMs })
      .then(response => {
        subscriber.next({
          data: response.toString("hex"),
        });
      })
      .catch(error => {
        tracer.trace(`exchange: error - ${error}`, { error });

        subscriber.next({
          error: serializeError(error as Parameters<typeof serializeError>[0]),
        });
      });
  });
};

export type TransportExchangeBulk =
  | {
      data: string;
    }
  | {
      error: ReturnType<typeof serializeError>;
    };
export const transportExchangeBulk = ({
  data,
  requestId,
}: MessagesMap["transport:exchangeBulk"]): Observable<TransportExchangeBulk> => {
  return new Observable(subscriber => {
    const tracer = new LocalTracer(LOG_TYPE_INTERNAL, {
      requestId,
      function: "transportExchangeBulk",
    });
    tracer.trace("transport:exchangeBulk message received", { data });

    const transport = transportForDevices.get(data.descriptor);
    if (!transport) {
      tracer.trace("No open transport for the given descriptor");

      subscriber.next({
        error: serializeError(
          new DisconnectedDeviceDuringOperation("No open transport for the given descriptor"),
        ),
      });

      return;
    }
    // apduHex isn't used for bulk case
    // subject.next({ type: "exchangeBulk", apdusHex: data.apdusHex, requestId });
    // transport.exchangeBulk();
    const { apdusHex } = data;

    const apdus = apdusHex.map(apduHex => Buffer.from(apduHex, "hex"));
    const subscription = transport.exchangeBulk(apdus, {
      next: response => {
        tracer.trace("exchangeBulk: next", { response: response.toString("hex") });

        subscriber.next({
          data: response.toString("hex"),
        });
      },
      error: error => {
        tracer.trace(`exchangeBulk: error - ${error}`, { error });

        subscriber.next({
          error: serializeError(error as Parameters<typeof serializeError>[0]),
        });
      },
      complete: () => {
        tracer.trace("exchangeBulk: complete");

        subscriber.complete();
      },
    });

    exchangeBulkSubscriptions.set(requestId, subscription);
  });
};

/**
 * Handles request messages to unsubscribe from a bulk exchange
 */
export const transportExchangeBulkUnsubscribe = ({
  data,
  requestId,
}: MessagesMap["transport:exchangeBulk:unsubscribe"]) => {
  const tracer = new LocalTracer(LOG_TYPE_INTERNAL, {
    requestId,
    function: "transportExchangeBulkUnsubscribe",
  });
  tracer.trace("transport:exchangeBulk:unsubscribe message received", { data });

  const transport = transportForDevices.get(data.descriptor);
  if (!transport) {
    tracer.trace("No open transport for the given descriptor");

    process.send?.({
      type: transportExchangeBulkUnsubscribeChannel,
      error: serializeError(
        new DisconnectedDeviceDuringOperation("No open transport for the given descriptor"),
      ),
      requestId,
    });
    return;
  }

  const subscription = exchangeBulkSubscriptions.get(requestId);

  if (subscription) {
    subscription.unsubscribe();
    exchangeBulkSubscriptions.delete(requestId);

    tracer.trace("Successfully unsubscribed from bulk exchange");
  } else {
    tracer.trace("No exchange bulk subscription to unsubscribe from");
  }
};

// Only listens to NodeHIDSingleton event - so USB event in this archi
export const transportListen = ({ requestId }: MessagesMap["transport:listen"]) => {
  const observable = new Observable(TransportNodeHidSingleton.listen);

  const subscription = observable.subscribe({
    next: e => {
      process.send?.({
        type: transportListenChannel,
        data: e,
        requestId,
      });
    },
    error: error => {
      process.send?.({
        type: transportListenChannel,
        error: serializeError(error),
        requestId,
      });
    },
  });

  transportListenListeners.set(requestId, subscription);
};

export const transportListenUnsubscribe = ({
  requestId,
}: MessagesMap["transport:listen:unsubscribe"]) => {
  const listener = transportListenListeners.get(requestId);
  if (listener) {
    listener.unsubscribe();
    transportListenListeners.delete(requestId);
  }
};

/**
 * Handles request messages to close an opened transport for a given descriptor/device id
 */
export const transportClose = async ({ data, requestId }: MessagesMap["transport:close"]) => {
  const tracer = new LocalTracer(LOG_TYPE_INTERNAL, {
    requestId,
    function: "transportClose",
  });
  tracer.trace("transport:close message received", { data });

  const transport = transportForDevices.get(data.descriptor);
  if (!transport) {
    tracer.trace("No open transport for the given descriptor");

    process.send?.({
      type: transportCloseChannel,
      error: serializeError(
        new DisconnectedDeviceDuringOperation("No open transport for the given descriptor"),
      ),
      requestId,
    });
    return;
  }

  try {
    await transport.close();
    tracer.trace("Successfully closed transport");
  } catch (error) {
    tracer.trace(`Error while closing transport: ${error}`, { error });
  }

  transportForDevices.delete(data.descriptor);

  process.send?.({
    type: transportCloseChannel,
    requestId,
    data,
  });
};
