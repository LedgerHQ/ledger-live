/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeAll, describe, expect, jest, test } from "@jest/globals";
import { transportExchange, transportOpen } from "./transportHandler";
import { MessagesMap } from "./types";
import { close, registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { aTransportBuilder } from "@ledgerhq/hw-transport-mocker";
import { beforeEach } from "node:test";
import Transport from "@ledgerhq/hw-transport";
import { firstValueFrom } from "rxjs";
import { DisconnectedDeviceDuringOperation } from "@ledgerhq/errors";

describe("transportHandler", () => {
  describe("transportOpen", () => {
    test("When no transport module associated to the tested device has been registered, it should return an error", done => {
      const params: MessagesMap["transport:open"] = {
        data: { descriptor: "" },
        requestId: "request_open_test",
      };

      transportOpen(params).subscribe({
        next: response => {
          try {
            expect(response).toEqual(
              expect.objectContaining({
                error: expect.objectContaining({ name: "CantOpenDevice" }),
              }),
            );
            done();
          } catch (expectError) {
            done(expectError as Error);
          }
        },
        error: error => {
          done(error);
        },
      });
    });

    test("When a transport module associated to the tested device has been registered, it should return a successful response", done => {
      const aTransport = aTransportBuilder();
      registerTransportModule({
        id: "transport_open_test",
        open: (id: string) => {
          // Needed to easily have several tests suites which register their own transport module
          if (id.startsWith("device_open_test")) {
            return Promise.resolve(aTransport);
          }
        },
        disconnect: () => Promise.resolve(),
      });

      const params: MessagesMap["transport:open"] = {
        data: { descriptor: "device_open_test" },
        requestId: "request_open_test",
      };

      transportOpen(params).subscribe({
        next: response => {
          try {
            expect(response).toEqual(
              expect.objectContaining({
                data: expect.anything(),
              }),
            );
            done();
          } catch (expectError) {
            done(expectError as Error);
          }
        },
        error: error => {
          done(error);
        },
      });
    });
  });

  describe("transportExchange", () => {
    test("When no transport associated to the device has been opened, it should return an error", done => {
      const params: MessagesMap["transport:exchange"] = {
        data: { descriptor: "device_exchange_test", apduHex: "0xBEEF" },
        requestId: "request_test",
      };

      transportExchange(params).subscribe({
        next: response => {
          try {
            expect(response).toEqual(
              expect.objectContaining({
                error: expect.objectContaining({ name: "DisconnectedDeviceDuringOperation" }),
              }),
            );
            done();
          } catch (expectError) {
            done(expectError as Error);
          }
        },
        error: error => {
          done(error);
        },
      });
    });

    describe("When a transport associated to the device has been opened", () => {
      let aTransport: Transport;
      const mockedExchange = jest.fn() as any;

      beforeAll(async () => {
        aTransport = aTransportBuilder({ exchange: mockedExchange });

        registerTransportModule({
          id: "transport_test",
          open: (id: string) => {
            // Needed to easily have several tests suites which register their own transport module
            if (id.startsWith("device_exchange_test")) {
              return Promise.resolve(aTransport);
            }
          },
          disconnect: () => Promise.resolve(),
        });

        const params: MessagesMap["transport:open"] = {
          data: { descriptor: "device_exchange_test" },
          requestId: "request_open_test",
        };
        await firstValueFrom(transportOpen(params));
      });

      beforeEach(() => {
        mockedExchange.mockClear();
      });

      test("When the exchange is successful, it should return the successful response", done => {
        mockedExchange.mockResolvedValueOnce(Buffer.from("9000", "hex"));

        const params: MessagesMap["transport:exchange"] = {
          data: { descriptor: "device_exchange_test", apduHex: "0xBEEF" },
          requestId: "request_exchange_test",
        };

        transportExchange(params).subscribe({
          next: response => {
            try {
              expect(response).toEqual(
                expect.objectContaining({
                  data: "9000",
                }),
              );
              done();
            } catch (expectError) {
              done(expectError as Error);
            }
          },
          error: error => {
            done(error);
          },
        });
      });

      test("When the exchange has encountered an error, it should return an error", done => {
        mockedExchange.mockRejectedValue(
          new DisconnectedDeviceDuringOperation("test exchange error"),
        );

        const params: MessagesMap["transport:exchange"] = {
          data: { descriptor: "device_exchange_test", apduHex: "0xBEEF" },
          requestId: "request_exchange_test",
        };

        transportExchange(params).subscribe({
          next: response => {
            try {
              expect(response).toEqual(
                expect.objectContaining({
                  error: expect.objectContaining({
                    name: "DisconnectedDeviceDuringOperation",
                    message: "test exchange error",
                  }),
                }),
              );
              done();
            } catch (expectError) {
              done(expectError as Error);
            }
          },
          error: error => {
            done(error);
          },
        });
      });
    });
  });
});
