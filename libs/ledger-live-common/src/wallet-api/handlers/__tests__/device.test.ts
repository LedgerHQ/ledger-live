import type { RefObject } from "react";
import type { Subject } from "rxjs";
import {
  createDeviceTransportHandler,
  createDeviceSelectHandler,
  createDeviceOpenHandler,
  createDeviceExchangeHandler,
  createDeviceCloseHandler,
} from "../device";
import { getDepsFrom, makeHandlerDeps } from "./testHelpers";
import type { DeviceTransport } from "../types";
import type { BidirectionalEvent } from "../../../hw/openTransportAsSubject";

type AnyEvent = Subject<BidirectionalEvent> | undefined;

function makeDevice(overrides: Partial<DeviceTransport> = {}): DeviceTransport {
  return {
    ref: { current: undefined } as RefObject<AnyEvent>,
    subscribe: jest.fn(),
    close: jest.fn(),
    exchange: jest.fn(() => Promise.resolve("exchanged")),
    ...overrides,
  };
}

const okResult = {
  device: { deviceId: "dev-1", modelId: "nanoX" },
  appAndVersion: { name: "Bitcoin", version: "2.1.0", flags: 0 },
};

describe("device.transport handler", () => {
  it("rejects when the UI handler is not configured", async () => {
    const handler = createDeviceTransportHandler(
      getDepsFrom(makeHandlerDeps({ device: makeDevice() })),
    );
    await expect(handler({ appName: "Bitcoin" } as never)).rejects.toThrow(
      "device.transport UI handler not configured",
    );
  });

  it("rejects when a device is already opened", async () => {
    const device = makeDevice({ ref: { current: {} } as RefObject<AnyEvent> });
    const handler = createDeviceTransportHandler(
      getDepsFrom(makeHandlerDeps({ device, uiDeviceTransport: jest.fn() })),
    );
    await expect(handler({ appName: "Bitcoin" } as never)).rejects.toThrow("Device already opened");
  });

  it("subscribes and resolves '1' on success", async () => {
    const device = makeDevice();
    let captured: any;
    const uiDeviceTransport = jest.fn(params => {
      captured = params;
    });
    const deps = makeHandlerDeps({ device, uiDeviceTransport });
    const handler = createDeviceTransportHandler(getDepsFrom(deps));

    const promise = handler({ appName: "Bitcoin" } as never);
    expect(deps.tracking.deviceTransportRequested).toHaveBeenCalledWith(deps.manifest);
    captured.onSuccess(okResult);

    await expect(promise).resolves.toBe("1");
    expect(device.subscribe).toHaveBeenCalledWith("dev-1");
    expect(deps.tracking.deviceTransportSuccess).toHaveBeenCalledWith(deps.manifest);
  });

  it("rejects when no device is returned", async () => {
    const device = makeDevice();
    let captured: any;
    const uiDeviceTransport = jest.fn(params => (captured = params));
    const handler = createDeviceTransportHandler(
      getDepsFrom(makeHandlerDeps({ device, uiDeviceTransport })),
    );
    const promise = handler({ appName: "Bitcoin" } as never);
    captured.onSuccess({ device: undefined, appAndVersion: undefined });
    await expect(promise).rejects.toThrow("No device");
  });

  it("rejects when the device model is not in the allowed devices list", async () => {
    const device = makeDevice();
    let captured: any;
    const uiDeviceTransport = jest.fn(params => (captured = params));
    const handler = createDeviceTransportHandler(
      getDepsFrom(makeHandlerDeps({ device, uiDeviceTransport })),
    );
    const promise = handler({ appName: "Bitcoin", devices: ["stax"] } as never);
    captured.onSuccess(okResult);
    await expect(promise).rejects.toThrow("Device not in the devices list");
  });

  it("rejects when the app version satisfies the range (negated check)", async () => {
    const device = makeDevice();
    let captured: any;
    const uiDeviceTransport = jest.fn(params => (captured = params));
    const handler = createDeviceTransportHandler(
      getDepsFrom(makeHandlerDeps({ device, uiDeviceTransport })),
    );
    const promise = handler({
      appName: "Bitcoin",
      appVersionRange: ">=2.0.0",
    } as never);
    captured.onSuccess(okResult);
    await expect(promise).rejects.toThrow("App version doesn't satisfies the range");
  });

  it("rejects and tracks fail on cancel", async () => {
    const device = makeDevice();
    let captured: any;
    const uiDeviceTransport = jest.fn(params => (captured = params));
    const deps = makeHandlerDeps({ device, uiDeviceTransport });
    const handler = createDeviceTransportHandler(getDepsFrom(deps));
    const promise = handler({ appName: "Bitcoin" } as never);
    captured.onCancel();
    await expect(promise).rejects.toThrow("User cancelled");
    expect(deps.tracking.deviceTransportFail).toHaveBeenCalledWith(deps.manifest);
  });

  it("settles only once (later onCancel ignored after onSuccess)", async () => {
    const device = makeDevice();
    let captured: any;
    const uiDeviceTransport = jest.fn(params => (captured = params));
    const handler = createDeviceTransportHandler(
      getDepsFrom(makeHandlerDeps({ device, uiDeviceTransport })),
    );
    const promise = handler({ appName: "Bitcoin" } as never);
    captured.onSuccess(okResult);
    captured.onCancel();
    await expect(promise).resolves.toBe("1");
  });
});

describe("device.select handler", () => {
  it("rejects when the UI handler is not configured", async () => {
    const handler = createDeviceSelectHandler(
      getDepsFrom(makeHandlerDeps({ device: makeDevice() })),
    );
    await expect(handler({ appName: "Bitcoin" } as never)).rejects.toThrow(
      "device.select UI handler not configured",
    );
  });

  it("rejects when a device is already opened", async () => {
    const device = makeDevice({ ref: { current: {} } as RefObject<AnyEvent> });
    const handler = createDeviceSelectHandler(
      getDepsFrom(makeHandlerDeps({ device, uiDeviceSelect: jest.fn() })),
    );
    await expect(handler({ appName: "Bitcoin" } as never)).rejects.toThrow("Device already opened");
  });

  it("resolves with the deviceId on success", async () => {
    const device = makeDevice();
    let captured: any;
    const uiDeviceSelect = jest.fn(params => (captured = params));
    const deps = makeHandlerDeps({ device, uiDeviceSelect });
    const handler = createDeviceSelectHandler(getDepsFrom(deps));
    const promise = handler({ appName: "Bitcoin" } as never);
    expect(deps.tracking.deviceSelectRequested).toHaveBeenCalledWith(deps.manifest);
    captured.onSuccess(okResult);
    await expect(promise).resolves.toBe("dev-1");
    expect(deps.tracking.deviceSelectSuccess).toHaveBeenCalledWith(deps.manifest);
  });

  it("rejects when no device is returned", async () => {
    const device = makeDevice();
    let captured: any;
    const uiDeviceSelect = jest.fn(params => (captured = params));
    const handler = createDeviceSelectHandler(
      getDepsFrom(makeHandlerDeps({ device, uiDeviceSelect })),
    );
    const promise = handler({ appName: "Bitcoin" } as never);
    captured.onSuccess({ device: undefined, appAndVersion: undefined });
    await expect(promise).rejects.toThrow("No device");
  });

  it("rejects when device model not in the devices list", async () => {
    const device = makeDevice();
    let captured: any;
    const uiDeviceSelect = jest.fn(params => (captured = params));
    const handler = createDeviceSelectHandler(
      getDepsFrom(makeHandlerDeps({ device, uiDeviceSelect })),
    );
    const promise = handler({ appName: "Bitcoin", devices: ["stax"] } as never);
    captured.onSuccess(okResult);
    await expect(promise).rejects.toThrow("Device not in the devices list");
  });

  it("rejects when the app version satisfies the range", async () => {
    const device = makeDevice();
    let captured: any;
    const uiDeviceSelect = jest.fn(params => (captured = params));
    const handler = createDeviceSelectHandler(
      getDepsFrom(makeHandlerDeps({ device, uiDeviceSelect })),
    );
    const promise = handler({
      appName: "Bitcoin",
      appVersionRange: ">=2.0.0",
    } as never);
    captured.onSuccess(okResult);
    await expect(promise).rejects.toThrow("App version doesn't satisfies the range");
  });

  it("rejects and tracks fail on cancel", async () => {
    const device = makeDevice();
    let captured: any;
    const uiDeviceSelect = jest.fn(params => (captured = params));
    const deps = makeHandlerDeps({ device, uiDeviceSelect });
    const handler = createDeviceSelectHandler(getDepsFrom(deps));
    const promise = handler({ appName: "Bitcoin" } as never);
    captured.onCancel();
    await expect(promise).rejects.toThrow("User cancelled");
    expect(deps.tracking.deviceSelectFail).toHaveBeenCalledWith(deps.manifest);
  });
});

describe("device.open handler", () => {
  it("rejects when a device is already opened", async () => {
    const device = makeDevice({ ref: { current: {} } as RefObject<AnyEvent> });
    const handler = createDeviceOpenHandler(getDepsFrom(makeHandlerDeps({ device })));
    await expect(handler({ deviceId: "dev-1" })).rejects.toThrow("Device already opened");
  });

  it("subscribes and returns '1'", () => {
    const device = makeDevice();
    const deps = makeHandlerDeps({ device });
    const handler = createDeviceOpenHandler(getDepsFrom(deps));
    const result = handler({ deviceId: "dev-1" });
    expect(result).toBe("1");
    expect(device.subscribe).toHaveBeenCalledWith("dev-1");
    expect(deps.tracking.deviceOpenRequested).toHaveBeenCalledWith(deps.manifest);
  });
});

describe("device.exchange handler", () => {
  it("rejects when no device is opened", async () => {
    const device = makeDevice();
    const handler = createDeviceExchangeHandler(getDepsFrom(makeHandlerDeps({ device })));
    await expect(handler({ apduHex: "00" } as never)).rejects.toThrow("No device opened");
  });

  it("delegates to device.exchange when a device is opened", async () => {
    const device = makeDevice({ ref: { current: {} } as RefObject<AnyEvent> });
    const deps = makeHandlerDeps({ device });
    const handler = createDeviceExchangeHandler(getDepsFrom(deps));
    const params = { apduHex: "00" } as never;
    await expect(handler(params)).resolves.toBe("exchanged");
    expect(device.exchange).toHaveBeenCalledWith(params);
    expect(deps.tracking.deviceExchangeRequested).toHaveBeenCalledWith(deps.manifest);
  });
});

describe("device.close handler", () => {
  it("rejects when no device is opened", async () => {
    const device = makeDevice();
    const handler = createDeviceCloseHandler(getDepsFrom(makeHandlerDeps({ device })));
    await expect(handler({ transportId: "t-1" })).rejects.toThrow("No device opened");
  });

  it("closes the device and resolves with the transportId", async () => {
    const device = makeDevice({ ref: { current: {} } as RefObject<AnyEvent> });
    const deps = makeHandlerDeps({ device });
    const handler = createDeviceCloseHandler(getDepsFrom(deps));
    await expect(handler({ transportId: "t-1" })).resolves.toBe("t-1");
    expect(device.close).toHaveBeenCalledTimes(1);
    expect(deps.tracking.deviceCloseRequested).toHaveBeenCalledWith(deps.manifest);
    expect(deps.tracking.deviceCloseSuccess).toHaveBeenCalledWith(deps.manifest);
  });
});
