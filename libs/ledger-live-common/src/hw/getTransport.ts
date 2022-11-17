import { Subject } from "rxjs";
import { withDevice } from "./deviceAccess";

export type BidirectionalEvent =
  | {
      type: "input-frame";
      apduHex: string;
    }
  | {
      type: "device-request";
      data: string;
    }
  | {
      type: "device-response";
      data: string;
    }
  | {
      type: "error";
      error: unknown;
    };

export type GetTransportRequest = {
  deviceId: string;
};

export default function getTransport({
  deviceId,
}: GetTransportRequest): Subject<BidirectionalEvent> {
  const subject = new Subject<BidirectionalEvent>();

  withDevice(deviceId)((transport) => {
    // The input part of the bidirectional communication
    subject.subscribe({
      next: (e) => {
        /**
         * Receiving an event from the ipc bridge allows us to pass a msg
         * into an ongoing withDevice job. Allowing to exchange messages with the
         * transport exposed from the job.
         */
        if (e?.type === "input-frame") {
          subject.next({ type: "device-request", data: e.apduHex });
          // TODO important avoiding collisions, also types will be broken
          transport
            .exchange(Buffer.from(e.apduHex, "hex"))
            .then((response) =>
              subject.next({
                type: "device-response",
                data: response.toString("hex"),
              })
            )
            .catch((error) => subject.next({ type: "error", error }));
        }
      },
    });

    return subject;
  }).toPromise();

  return subject;
}
