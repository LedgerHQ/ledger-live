import { Subject } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { DisconnectedDeviceDuringOperation, serializeError } from "@ledgerhq/errors";

type APDUMessage = { apduHex: string; requestId: string };
const transports = new Map<string, Subject<APDUMessage>>();

export const transportOpenChannel = "transport:open";
export const transportExchangeChannel = "transport:exchange";
export const transportCloseChannel = "transport:close";

export const transportOpen = ({
  data,
  requestId,
}: {
  data: { descriptor: string };
  requestId: string;
}) => {
  const subjectExist = transports.get(data.descriptor);

  if (!subjectExist) {
    withDevice(data.descriptor)(transport => {
      const subject = new Subject<APDUMessage>();
      transports.set(data.descriptor, subject);

      subject.subscribe({
        next: e => {
          transport
            .exchange(Buffer.from(e.apduHex, "hex"))
            .then(response =>
              process.send?.({
                type: transportExchangeChannel,
                data: response.toString("hex"),
                requestId: e.requestId,
              }),
            )
            .catch(error =>
              process.send?.({
                type: transportExchangeChannel,
                error: serializeError(error),
                requestId: e.requestId,
              }),
            );
        },
        complete: () => {
          transports.delete(data.descriptor);
        },
      });

      return subject;
    }).subscribe();
  }

  process.send?.({
    type: transportOpenChannel,
    data,
    requestId,
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
    process.send?.({
      type: transportExchangeChannel,
      error: serializeError(
        new DisconnectedDeviceDuringOperation("No open transport for the given descriptor"),
      ),
      requestId,
    });
    return;
  }
  subject.next({ apduHex: data.apduHex, requestId });
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
    process.send?.({
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
      process.send?.({
        type: transportCloseChannel,
        data,
        requestId,
      });
    },
  });
  subject.complete();
};
