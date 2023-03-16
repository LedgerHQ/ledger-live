import { Subject, Observable } from "rxjs";
import TransportNodeHidSingleton from "@ledgerhq/hw-transport-node-hid-singleton";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { DisconnectedDeviceDuringOperation, serializeError } from "@ledgerhq/errors";
import {
  transportCloseChannel,
  transportExchangeChannel,
  transportExchangeBulkChannel,
  transportOpenChannel,
  transportExchangeBulkUnsubscribeChannel,
  transportListenChannel,
} from "~/config/transportChannels";

// simple pattern to channel all responses back to renderer
// TODO: codebase can be simplified to embed the logic directly in place
export const responses = new Subject();
function respond(message: any) {
  responses.next(message);
}

type APDUMessage =
  | { type: "exchange"; apduHex: string; requestId: string }
  | { type: "exchangeBulk"; apdusHex: string[]; requestId: string }
  | { type: "exchangeBulkUnsubscribe"; requestId: string };

const transports = new Map<string, Subject<APDUMessage>>();
const transportsBulkSubscriptions = new Map<string, { unsubscribe: () => void }>();

export const transportOpen = ({
  data,
  requestId,
}: {
  data: { descriptor: string };
  requestId: string;
}) => {
  const subjectExist = transports.get(data.descriptor);

  const onEnd = () => {
    respond({
      type: transportOpenChannel,
      data,
      requestId,
    });
  };

  // If already exists simply return success
  if (subjectExist) {
    return onEnd();
  }

  withDevice(data.descriptor)(transport => {
    const subject = new Subject<APDUMessage>();
    subject.subscribe({
      next: e => {
        if (e.type === "exchange") {
          transport
            .exchange(Buffer.from(e.apduHex, "hex"))
            .then(response =>
              respond({
                type: transportExchangeChannel,
                data: response.toString("hex"),
                requestId: e.requestId,
              }),
            )
            .catch(error =>
              respond({
                type: transportExchangeChannel,
                error: serializeError(error),
                requestId: e.requestId,
              }),
            );
        } else if (e.type === "exchangeBulk") {
          const apdus = e.apdusHex.map(apduHex => Buffer.from(apduHex, "hex"));
          const subscription = transport.exchangeBulk(apdus, {
            next: response => {
              respond({
                type: transportExchangeBulkChannel,
                data: response.toString("hex"),
                requestId: e.requestId,
              });
            },
            error: error => {
              respond({
                type: transportExchangeBulkChannel,
                error: serializeError(error),
                requestId: e.requestId,
              });
            },
            complete: () => {
              respond({
                type: transportExchangeBulkChannel,
                requestId: e.requestId,
              });
            },
          });
          transportsBulkSubscriptions.set(e.requestId, subscription);
        } else if (e.type === "exchangeBulkUnsubscribe") {
          const subscription = transportsBulkSubscriptions.get(e.requestId);
          if (subscription) {
            subscription.unsubscribe();
            transportsBulkSubscriptions.delete(e.requestId);
          }
        }
      },
      complete: () => {
        transports.delete(data.descriptor);
      },
    });

    transports.set(data.descriptor, subject);

    onEnd();

    return subject;
  }).subscribe({
    error: error => {
      respond({
        type: transportOpenChannel,
        error: serializeError(error),
        requestId,
      });
    },
  });
};

export const transportExchange = ({
  data,
  requestId,
}: {
  data: { descriptor: string; apduHex: string };
  requestId: string;
}) => {
  const subject = transports.get(data.descriptor);
  if (!subject) {
    respond({
      type: transportExchangeChannel,
      error: serializeError(
        new DisconnectedDeviceDuringOperation("No open transport for the given descriptor"),
      ),
      requestId,
    });
    return;
  }
  subject.next({ type: "exchange", apduHex: data.apduHex, requestId });
};

export const transportExchangeBulk = ({
  data,
  requestId,
}: {
  data: { descriptor: string; apdusHex: string[] };
  requestId: string;
}) => {
  const subject = transports.get(data.descriptor);
  if (!subject) {
    respond({
      type: transportExchangeBulkChannel,
      error: serializeError(
        new DisconnectedDeviceDuringOperation("No open transport for the given descriptor"),
      ),
      requestId,
    });
    return;
  }
  // apduHex isn't used for bulk case
  subject.next({ type: "exchangeBulk", apdusHex: data.apdusHex, requestId });
};

export const transportExchangeBulkUnsubscribe = ({
  data,
  requestId,
}: {
  data: { descriptor: string };
  requestId: string;
}) => {
  const subject = transports.get(data.descriptor);
  if (!subject) {
    respond({
      type: transportExchangeBulkUnsubscribeChannel,
      error: serializeError(
        new DisconnectedDeviceDuringOperation("No open transport for the given descriptor"),
      ),
      requestId,
    });
    return;
  }
  subject.next({ type: "exchangeBulkUnsubscribe", requestId });
};

const transportListenListeners = new Map<string, { unsubscribe: () => void }>();

export const transportListen = ({ requestId }: { requestId: string }) => {
  const observable = new Observable(TransportNodeHidSingleton.listen);
  const subscription = observable.subscribe({
    next: ({ deviceModel, ...rest }) => {
      respond({
        type: transportListenChannel,
        data: rest,
        deviceModelId: deviceModel?.id,
        requestId,
      });
    },
    error: error => {
      respond({
        type: transportListenChannel,
        error: serializeError(error),
        requestId,
      });
    },
  });
  transportListenListeners.set(requestId, subscription);
};

export const transportListenUnsubscribe = ({ requestId }: { requestId: string }) => {
  const listener = transportListenListeners.get(requestId);
  if (listener) {
    listener.unsubscribe();
    transportListenListeners.delete(requestId);
  }
};

export const transportClose = ({
  data,
  requestId,
}: {
  data: { descriptor: string };
  requestId: string;
}) => {
  const subject = transports.get(data.descriptor);
  if (!subject) {
    respond({
      type: transportCloseChannel,
      error: serializeError(
        new DisconnectedDeviceDuringOperation("No open transport for the given descriptor"),
      ),
      requestId,
    });
    return;
  }
  subject.subscribe({
    complete: () => {
      respond({
        type: transportCloseChannel,
        data,
        requestId,
      });
    },
  });
  subject.complete();
};
