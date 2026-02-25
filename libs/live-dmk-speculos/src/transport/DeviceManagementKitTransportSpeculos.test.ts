/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock("@ledgerhq/device-transport-kit-speculos", () => {
  class HttpSpeculosDatasource {
    openEventStream() {
      return Promise.resolve({ cancel: jest.fn() });
    }
  }

  return {
    __esModule: true,
    speculosTransportFactory: jest.fn(),
    HttpSpeculosDatasource,
  };
});

jest.mock("@ledgerhq/speculos-device-controller", () => ({
  deviceControllerClientFactory: jest.fn(),
}));

import DeviceManagementKitTransportSpeculos, {
  SpeculosButton,
} from "./DeviceManagementKitTransportSpeculos";
import {
  DeviceManagementKitBuilder,
  DeviceModelId,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import * as speculosTransportFactoryModule from "@ledgerhq/device-transport-kit-speculos";
import * as speculosDeviceControllerModule from "@ledgerhq/speculos-device-controller";
import { Subject } from "rxjs";

const flushPromises = () => new Promise<void>(resolve => setImmediate(resolve));

const fakeDevice: DiscoveredDevice = {
  id: "dev-1",
  deviceModel: { id: "dm-1", model: DeviceModelId.STAX, name: "stax" },
  rssi: undefined,
  name: "test-device",
  transport: "web-hid",
};

async function openTransport(
  options?: Parameters<typeof DeviceManagementKitTransportSpeculos.open>[0],
) {
  const openPromise = DeviceManagementKitTransportSpeculos.open(options);
  await flushPromises();
  listenSubject.next([fakeDevice]);
  return openPromise;
}

let listenSubject: Subject<DiscoveredDevice[]>;
let fakeDmk: any;

let pressMock: ReturnType<typeof jest.fn>;
let openEventHandlers: { onEvent?: (e: any) => void; onClose?: () => void };

beforeAll(() => {
  process.env.SPECULOS_TRANSPORT_SSE = "true";

  listenSubject = new Subject<DiscoveredDevice[]>();

  fakeDmk = {
    listenToAvailableDevices: jest.fn().mockImplementation(() => listenSubject.asObservable()),
    connect: jest.fn().mockResolvedValue("session-1"),
    sendApdu: jest.fn(),
    disconnect: jest.fn(),
  };

  jest.spyOn(DeviceManagementKitBuilder.prototype, "addTransport").mockReturnThis();
  jest.spyOn(DeviceManagementKitBuilder.prototype, "addLogger").mockReturnThis();
  jest.spyOn(DeviceManagementKitBuilder.prototype, "build").mockReturnValue(fakeDmk);

  jest.spyOn(speculosTransportFactoryModule, "speculosTransportFactory").mockReturnValue(
    // @ts-expect-error – just a placeholder for the DMK builder
    "fake-transport",
  );

  pressMock = jest.fn().mockResolvedValue(undefined);
  jest.spyOn(speculosDeviceControllerModule, "deviceControllerClientFactory").mockImplementation(
    //@ts-expect-error adf
    () => ({
      buttonFactory: () => ({
        press: pressMock,
        left: jest.fn().mockResolvedValue(undefined),
        right: jest.fn().mockResolvedValue(undefined),
        both: jest.fn().mockResolvedValue(undefined),
        pressSequence: jest.fn().mockResolvedValue(undefined),
      }),
    }),
  );

  openEventHandlers = {};
  jest
    .spyOn(speculosTransportFactoryModule.HttpSpeculosDatasource.prototype, "openEventStream")
    .mockImplementation(async function (onEvent: any, onClose: any) {
      openEventHandlers.onEvent = onEvent;
      openEventHandlers.onClose = onClose;
      // Return an object that has a cancel() method so transport.close() is safe
      return { cancel: jest.fn() } as any;
    });
});

afterEach(() => {
  jest.clearAllMocks();
  listenSubject = new Subject<DiscoveredDevice[]>();
  fakeDmk.listenToAvailableDevices.mockImplementation(() => listenSubject.asObservable());
  // Clear the static cache between tests
  DeviceManagementKitTransportSpeculos["byBase"].clear();
});

describe("DeviceManagementKitTransportSpeculos", () => {
  it("isSupported() resolves to true", async () => {
    await expect(DeviceManagementKitTransportSpeculos.isSupported()).resolves.toBe(true);
  });

  it("list() resolves to an empty array", async () => {
    await expect(DeviceManagementKitTransportSpeculos.list()).resolves.toEqual([]);
  });

  it("listen() returns an object with unsubscribe()", () => {
    const sub = DeviceManagementKitTransportSpeculos.listen({});
    expect(sub).toHaveProperty("unsubscribe");
    expect(() => sub.unsubscribe()).not.toThrow();
  });

  it("open() successfully opens a transport instance", async () => {
    // when
    const transport = await openTransport({ apiPort: "1234" });

    // then
    expect(transport).toBeInstanceOf(DeviceManagementKitTransportSpeculos);
  });

  it.each([
    [SpeculosButton.LEFT, "left"],
    [SpeculosButton.RIGHT, "right"],
    [SpeculosButton.BOTH, "both"],
  ])("button() maps press", async (buttonEnum, expected) => {
    // given
    const transport = await openTransport();
    pressMock.mockClear();

    // when
    await transport.button(buttonEnum);

    // then
    expect(pressMock).toHaveBeenCalledTimes(1);
    expect(pressMock).toHaveBeenCalledWith(expected);
  });

  it("propagates errors from button() controller call", async () => {
    // given
    const transport = await openTransport();

    // when
    pressMock.mockRejectedValueOnce(new Error("button-failed"));

    // then
    await expect(transport.button(SpeculosButton.LEFT)).rejects.toThrow("button-failed");
  });

  it("exchange() sends an APDU and returns the full response buffer", async () => {
    // given
    fakeDmk.sendApdu.mockResolvedValue({
      data: Uint8Array.from([0x90]),
      statusCode: new Uint8Array([0x00]),
    });

    const transport = await openTransport();
    const apdu = Buffer.from([0x00, 0x01]);

    // when
    const resp = await transport.exchange(apdu);

    // then
    expect(fakeDmk.sendApdu).toHaveBeenCalledWith({
      sessionId: "session-1",
      apdu: new Uint8Array(apdu.buffer, apdu.byteOffset, apdu.byteLength),
    });
    expect(resp).toEqual(Buffer.from([0x90, 0x00]));
  });

  it("propagates errors from exchange() when sendApdu fails after retry", async () => {
    // given
    const transport = await openTransport();
    fakeDmk.sendApdu.mockRejectedValue(new Error("apdu-failed"));

    // when - exchange fails, triggers session reset and retry
    const exchangePromise = transport.exchange(Buffer.from([0x00]));

    // Allow session re-establishment by emitting devices again
    await flushPromises();
    listenSubject.next([fakeDevice]);

    // then - retry also fails with the same error
    await expect(exchangePromise).rejects.toThrow("apdu-failed");
  });

  // it("automationEvents emits objects from openEventStream callback", async () => {
  //   // given
  //   const transport = await DeviceManagementKitTransportSpeculos.open();
  //   await flushPromises();

  //   const received: any[] = [];
  //   const sub = transport.automationEvents.subscribe(e => received.push(e));

  //   // when
  //   const payload = { all: "good?" };
  //   openEventHandlers.onEvent?.(payload);

  //   // then
  //   expect(received).toEqual([payload]);
  //   sub.unsubscribe();
  // });

  // it("emits a Transport 'disconnect' when the SSE stream closes", async () => {
  //   // given
  //   const transport = await DeviceManagementKitTransportSpeculos.open();
  //   await flushPromises();

  //   const errors: any[] = [];
  //   transport.on("disconnect", (err: any) => errors.push(err));

  //   // when
  //   openEventHandlers.onClose?.();

  //   // then
  //   expect(errors.length).toBe(1);
  //   expect(errors[0]).toBeInstanceOf(DisconnectedDevice);
  //   expect(errors[0].message).toBe("Speculos exited!");
  // });
});
