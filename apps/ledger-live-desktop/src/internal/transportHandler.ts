import { Observable, ReplaySubject, catchError, map, of, takeUntil } from "rxjs";
import TransportNodeHidSingleton, {
  ListenDescriptorEvent,
} from "@ledgerhq/hw-transport-node-hid-singleton";
import { open } from "@ledgerhq/live-common/hw/index";
import { DisconnectedDeviceDuringOperation, serializeError } from "@ledgerhq/errors";
import { MessagesMap } from "./types";
import { LocalTracer, trace } from "@ledgerhq/logs";
import { LOG_TYPE_INTERNAL } from "./logger";
import { DeviceId } from "@ledgerhq/types-live";
import Transport from "@ledgerhq/hw-transport";

// Subscriptions to bulk exchanges
const exchangeBulkSubscriptions = new Map<string, { unsubscribe: () => void }>();

// Clean-up functions to stop listening to a Transport listen
const transportListenCleanups = new Map<string, ReplaySubject<void>>();

const transportForDevices = new Map<DeviceId, Transport>();

export type TransportOpenResponse =
  | {
      type: "ok";
      data: MessagesMap["transport:open"]["data"];
    }
  | {
      type: "error";
      error: ReturnType<typeof serializeError>;
    };
/**
 * Handles request messages to open a transport for a given descriptor/device id
 */
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
        type: "ok",
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
          type: "error",
          error: serializeError(error as Parameters<typeof serializeError>[0]),
        });
        subscriber.complete();
      });
  });
};

export type TransportExchange =
  | {
      type: "ok";
      data: string;
    }
  | {
      type: "error";
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
        type: "error",
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
          type: "ok",
          data: response.toString("hex"),
        });
      })
      .catch(error => {
        tracer.trace(`exchange: error - ${error}`, { error });

        subscriber.next({
          type: "error",
          error: serializeError(error as Parameters<typeof serializeError>[0]),
        });
      });
  });
};

export type TransportExchangeBulk =
  | {
      type: "ok";
      data: string;
    }
  | {
      type: "error";
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
        type: "error",
        error: serializeError(
          new DisconnectedDeviceDuringOperation("No open transport for the given descriptor"),
        ),
      });

      return;
    }

    const { apdusHex } = data;
    const apdus = apdusHex.map(apduHex => Buffer.from(apduHex, "hex"));

    const subscription = transport.exchangeBulk(apdus, {
      next: response => {
        tracer.trace("exchangeBulk: next", { response: response.toString("hex") });

        subscriber.next({
          type: "ok",
          data: response.toString("hex"),
        });
      },
      error: error => {
        tracer.trace(`exchangeBulk: error - ${error}`, { error });

        subscriber.next({
          type: "error",
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

export type TransportExchangeBulkUnsubscribe = {
  type: "error";
  error: ReturnType<typeof serializeError>;
};
/**
 * Handles request messages to unsubscribe from listening to a bulk exchange
 */
export const transportExchangeBulkUnsubscribe = ({
  data,
  requestId,
}: MessagesMap["transport:exchangeBulk:unsubscribe"]): Observable<TransportExchangeBulkUnsubscribe> => {
  return new Observable(subscriber => {
    const tracer = new LocalTracer(LOG_TYPE_INTERNAL, {
      requestId,
      function: "transportExchangeBulkUnsubscribe",
    });
    tracer.trace("transport:exchangeBulk:unsubscribe message received", { data });

    const transport = transportForDevices.get(data.descriptor);
    if (!transport) {
      tracer.trace("No open transport for the given descriptor");

      subscriber.next({
        type: "error",
        error: serializeError(
          new DisconnectedDeviceDuringOperation("No open transport for the given descriptor"),
        ),
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

    subscriber.complete();
  });
};

export type TransportListen =
  | {
      type: "ok";
      data: ListenDescriptorEvent;
    }
  | {
      type: "error";
      error: ReturnType<typeof serializeError>;
    };
/**
 * Handles request messages to listen to device events
 *
 * Current implementation: only listens to TransportNodeHidSingleton events
 */
export const transportListen = ({
  requestId,
}: MessagesMap["transport:listen"]): Observable<TransportListen> => {
  trace({
    type: LOG_TYPE_INTERNAL,
    message: "transport:listen message received",
    context: { requestId },
  });
  const observable = new Observable(TransportNodeHidSingleton.listen);
  const clearListener = new ReplaySubject<void>();
  transportListenCleanups.set(requestId, clearListener);

  return observable.pipe(
    takeUntil(clearListener),
    map(e => ({
      type: "ok" as const,
      data: e,
    })),
    catchError(error => of({ type: "error" as const, error: serializeError(error) })),
  );
};

/**
 * Handles request messages to unsubscribe from listening to device events
 */
export const transportListenUnsubscribe = ({
  requestId,
}: MessagesMap["transport:listen:unsubscribe"]): Observable<void> => {
  return new Observable(subscriber => {
    trace({
      type: LOG_TYPE_INTERNAL,
      message: "transport:listen:unsubscribe message received",
      context: { requestId },
    });

    const cleanup = transportListenCleanups.get(requestId);
    if (cleanup) {
      cleanup.next();
      transportListenCleanups.delete(requestId);
    }

    subscriber.complete();
  });
};

export type TransportCloseResponse =
  | {
      type: "ok";
      data: MessagesMap["transport:close"]["data"];
    }
  | {
      type: "error";
      error: ReturnType<typeof serializeError>;
    };
/**
 * Handles request messages to close an opened transport for a given descriptor/device id
 */
export const transportClose = ({
  data,
  requestId,
}: MessagesMap["transport:close"]): Observable<TransportCloseResponse> => {
  return new Observable(subscriber => {
    const tracer = new LocalTracer(LOG_TYPE_INTERNAL, {
      requestId,
      function: "transportClose",
    });
    tracer.trace("transport:close message received", { data });

    const transport = transportForDevices.get(data.descriptor);
    if (!transport) {
      tracer.trace("No open transport for the given descriptor");

      subscriber.next({
        type: "error",
        error: serializeError(
          new DisconnectedDeviceDuringOperation("No open transport for the given descriptor"),
        ),
      });
      return;
    }

    transport
      .close()
      .then(() => {
        tracer.trace("Successfully closed transport");

        subscriber.next({
          type: "ok",
          data,
        });
      })
      .catch(error => {
        tracer.trace(`Error while closing transport: ${error}`, { error });
      })
      .finally(() => {
        transportForDevices.delete(data.descriptor);
        subscriber.complete();
      });
  });
};
