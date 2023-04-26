import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import { toArray } from "rxjs/operators";
import WS from "isomorphic-ws";
import scenarios from "./scenarios.mock";
import { createDeviceSocket } from ".";
/**
 * Both ends of the exchange are mocked in this test file and we are merely testing
 * the logic that happens in-between.
 */

jest.mock("isomorphic-ws", () => ({
  ...jest.requireActual("isomorphic-ws"),
  __esModule: true,
  default: jest.fn(),
}));

describe("Scriptrunner logic", () => {
  scenarios.forEach(({ describe, device, events }) => {
    it(describe, async () => {
      // Generate a transport replayer with the data from the test
      const transport = await openTransportReplayer(
        RecordStore.fromString(device)
      );

      WS.mockImplementation(() => {
        let msgIndex = 0;
        const callbacks: { [key: string]: ((any) => void) | undefined } = {
          onopen: undefined,
          onerror: undefined,
          onclose: undefined,
          onmessage: undefined,
          send: undefined,
          close: () => undefined,
        };

        const onReceiveMessage = (_) => {
          // Nb get next message and invoke callback
          msgIndex++;
          const [callback, payload] = events[msgIndex];
          if (payload?.includes("e051000000")) {
            // Need to delay the next apdu to see the allow secure channel event.
            transport.setArtificialExchangeDelay(1000);
          }
          const maybeCallback = callbacks[callback];
          if (maybeCallback) {
            maybeCallback({ data: payload });
          }

          // Check if the next event should be emitted straight away instead of as
          // a response to a message. This is used to trigger errors and closing the
          // connection from the scriptrunner side.
          const nextEvent = events[msgIndex + 1];
          if (nextEvent) {
            const [callback, payload, eager] = nextEvent;
            const maybeCallback = callbacks[callback];
            if (maybeCallback && eager) {
              setTimeout(() => {
                // Emit without any further device interaction
                maybeCallback({ data: payload });
              }, 200);
            }
          }
        };

        callbacks.send = onReceiveMessage;
        setTimeout(() => {
          if (callbacks.onopen) {
            callbacks.onopen(null);
            const [callback, payload] = events[msgIndex];
            const maybeCallback = callbacks[callback];
            if (maybeCallback) {
              maybeCallback({ data: payload });
            }
          }
        }, 0);

        return callbacks;
      });

      // Mock the socket connection
      try {
        const resolved = await createDeviceSocket(transport, {
          url: "no-need-for-a-url",
        })
          .pipe(toArray())
          .toPromise();
        expect(resolved).toMatchSnapshot();
      } catch (error: unknown) {
        expect(error).toMatchSnapshot();
      }

      return;
    });
  });
});
