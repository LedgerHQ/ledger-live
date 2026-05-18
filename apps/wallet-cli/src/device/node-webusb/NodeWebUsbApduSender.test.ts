import { describe, expect, it } from "bun:test";
import type {
  ApduReceiverServiceFactory,
  ApduSenderServiceFactory,
  LoggerPublisherService,
} from "@ledgerhq/device-management-kit";
import { NodeWebUsbApduSender } from "./NodeWebUsbApduSender";

function flushTasks(): Promise<void> {
  return new Promise(resolve => queueMicrotask(resolve));
}

function createLogger(): LoggerPublisherService {
  return {
    subscribers: [],
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  } as unknown as LoggerPublisherService;
}

describe("NodeWebUsbApduSender", () => {
  it("waits for the active read loop before closing", async () => {
    let resolveTransferIn: ((result: { status: "ok"; data: DataView }) => void) | undefined;
    let transferInStarted: (() => void) | undefined;
    const transferInStartedPromise = new Promise<void>(resolve => {
      transferInStarted = resolve;
    });

    const device = {
      opened: true,
      transferOut: async () => ({ status: "ok" }),
      transferIn: async () => {
        transferInStarted?.();
        return new Promise<{ status: "ok"; data: DataView }>(resolve => {
          resolveTransferIn = resolve;
        });
      },
      releaseInterface: async () => {},
      close: async () => {},
    };

    const apduSenderFactory = (() => ({
      getFrames: () => [
        {
          getRawData: () => new Uint8Array([0xe0, 0x01, 0x00, 0x00]),
        },
      ],
    })) as unknown as ApduSenderServiceFactory;

    const apduReceiverFactory = (() => ({
      handleFrame: () => {
        throw new Error("read loop should stop before handling frames");
      },
    })) as unknown as ApduReceiverServiceFactory;

    const sender = new NodeWebUsbApduSender({
      dependencies: { device: device as never, interfaceNumber: 1 },
      apduSenderFactory,
      apduReceiverFactory,
      loggerFactory: () => createLogger(),
    });

    const sendPromise = sender.sendApdu(new Uint8Array([0xe0, 0x01, 0x00, 0x00]));
    await transferInStartedPromise;

    let closeSettled = false;
    const closePromise = sender.closeConnection().then(() => {
      closeSettled = true;
    });

    await flushTasks();
    expect(closeSettled).toBe(false);

    resolveTransferIn?.({ status: "ok", data: new DataView(new ArrayBuffer(0)) });
    await closePromise;

    const sendResult = await sendPromise;
    expect(sendResult.isLeft()).toBe(true);
  });

  it("does not wait forever when the active read loop is stuck", async () => {
    let transferInStarted: (() => void) | undefined;
    const transferInStartedPromise = new Promise<void>(resolve => {
      transferInStarted = resolve;
    });

    const device = {
      opened: true,
      transferOut: async () => ({ status: "ok" }),
      transferIn: async () => {
        transferInStarted?.();
        return new Promise<{ status: "ok"; data: DataView }>(() => {});
      },
      releaseInterface: async () => {},
      close: async () => {},
    };

    const apduSenderFactory = (() => ({
      getFrames: () => [
        {
          getRawData: () => new Uint8Array([0xe0, 0x01, 0x00, 0x00]),
        },
      ],
    })) as unknown as ApduSenderServiceFactory;

    const apduReceiverFactory = (() => ({
      handleFrame: () => {
        throw new Error("read loop should not resolve in this test");
      },
    })) as unknown as ApduReceiverServiceFactory;

    const sender = new NodeWebUsbApduSender({
      dependencies: { device: device as never, interfaceNumber: 1 },
      apduSenderFactory,
      apduReceiverFactory,
      loggerFactory: () => createLogger(),
      closeReadLoopTimeoutMs: 5,
    });

    const sendPromise = sender.sendApdu(new Uint8Array([0xe0, 0x01, 0x00, 0x00]));
    await transferInStartedPromise;

    await sender.closeConnection();

    const sendResult = await sendPromise;
    expect(sendResult.isLeft()).toBe(true);
  });
});
