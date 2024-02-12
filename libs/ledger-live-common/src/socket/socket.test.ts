import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { toArray } from "rxjs/operators";
import WS from "isomorphic-ws";
import scenarios from "./scenarios.mock";
import { createDeviceSocket } from ".";
import { firstValueFrom } from "rxjs";

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
      const transport = await openTransportReplayer(RecordStore.fromString(device));

      WS.mockImplementation(() => {
        let msgIndex = 0;

        // Exposed WebSocket callbacks:
        // - `on*` are implemented inside `createDeviceSocket`
        // - `send` is used to send back messages to the HSM
        // - `close` is used to close the connection with the HSM
        const callbacks: { [key: string]: ((any) => void) | undefined } = {
          onopen: undefined,
          onerror: undefined,
          onclose: undefined,
          onmessage: undefined,
          send: undefined,
          close: () => undefined,
        };

        callbacks.send = _ => {
          // Iterates to the next scenario event once the fake device sends a response to the HSM
          msgIndex++;
          const [callback, payload] = events[msgIndex];
          const nextEvent = events[msgIndex + 1];
          const [nextEventCallback, nextEventPayload, nextEventEager] = nextEvent
            ? nextEvent
            : [undefined, undefined, undefined];
          let isExchangeBlocked = false;

          // The next event (from the HSM) is an allow secure channel
          if (payload?.includes("e051000000")) {
            // Needs to delay the next APDU to see the allow secure channel event.
            transport.setArtificialExchangeDelay(1000);
          }

          // If the current message is a bulk, and we want the HSM to send a message (like success) directly after,
          // we slowdown
          if (payload?.includes("bulk") && nextEventEager) {
            isExchangeBlocked = true;
            transport.enableExchangeBlocker();
          }

          const maybeCallback = callbacks[callback];
          if (maybeCallback) {
            maybeCallback({ data: payload });
          }

          // Checks if the next event should be emitted straight away instead of as
          // a (device) response to the current event HSM message.
          // This is used to trigger errors and closing the connection from the scriptrunner side.
          if (nextEvent && nextEventCallback) {
            const maybeCallback = callbacks[nextEventCallback];
            if (maybeCallback && nextEventEager) {
              if (isExchangeBlocked) {
                maybeCallback({ data: nextEventPayload });
                transport.unblockExchange();
                isExchangeBlocked = false;
              } else {
                setTimeout(() => {
                  // Emits without any further device interaction
                  maybeCallback({ data: nextEventPayload });
                }, 200);
              }
            }
          }
        };

        // Starts the fake WebSocket communication with the HSM
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
        const resolved = await firstValueFrom(
          createDeviceSocket(transport, {
            url: "no-need-for-a-url",
          }).pipe(toArray()),
        );
        expect(resolved).toMatchSnapshot();
      } catch (error: unknown) {
        expect(error).toMatchSnapshot();
      }

      return;
    });
  });
});
