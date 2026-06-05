import { describe, expect, it } from "bun:test";
import {
  defaultApduReceiverServiceStubBuilder,
  defaultApduSenderServiceStubBuilder,
  OpeningConnectionError,
  SendApduTimeoutError,
} from "@ledgerhq/device-management-kit";
import type {
  ApduReceiverServiceFactory,
  ApduSenderServiceFactory,
  LoggerPublisherService,
} from "@ledgerhq/device-management-kit";
import { Left, Maybe } from "purify-ts";
import { NodeWebUsbApduSender } from "./NodeWebUsbApduSender";
import { FRAME_SIZE } from "./node-webusb-constants";

function flushTasks(): Promise<void> {
  return new Promise(resolve => queueMicrotask(resolve));
}

function createLogger(overrides: Partial<LoggerPublisherService> = {}): LoggerPublisherService {
  return {
    subscribers: [],
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    ...overrides,
  } as unknown as LoggerPublisherService;
}

// GeneralDmkError stores the underlying cause on `originalError`, not `message`.
function causeMessage(error: unknown): string {
  return String((error as { originalError?: Error }).originalError?.message ?? "");
}

// Production DMK framing services (the real APDU framer/deframer), wired with a
// no-op logger. Using these instead of stubbed factories exercises the actual
// byte-level seam: APDU -> 64-byte frames -> transferOut, then transferIn frames
// -> reassembled APDU + status code.
const realSenderFactory: ApduSenderServiceFactory = args =>
  defaultApduSenderServiceStubBuilder(args, () => createLogger());
const realReceiverFactory: ApduReceiverServiceFactory = args =>
  defaultApduReceiverServiceStubBuilder(args, () => createLogger());

/**
 * Async FIFO of USB bulk-in frames. `pop()` resolves immediately when a frame is
 * queued, otherwise it parks until the next `push()`.
 */
function createFrameQueue() {
  const frames: Uint8Array[] = [];
  let waiter: ((frame: Uint8Array) => void) | null = null;
  return {
    push(frame: Uint8Array): void {
      if (waiter) {
        const resolve = waiter;
        waiter = null;
        resolve(frame);
      } else {
        frames.push(frame);
      }
    },
    pop(): Promise<Uint8Array> {
      const next = frames.shift();
      if (next) return Promise.resolve(next);
      return new Promise(resolve => {
        waiter = resolve;
      });
    },
  };
}

/**
 * In-memory Ledger device that talks the real DMK framing protocol: it deframes
 * the host's command with a device-side receiver (mirroring the channel taken
 * from the first frame), then reframes a configured response so the host's
 * receiver reassembles it. This validates both directions end-to-end without USB.
 */
function createFakeLedgerDevice(response: { data: Uint8Array; status: Uint8Array }) {
  const outFrames = createFrameQueue();
  const receivedCommands: Uint8Array[] = [];
  let deviceReceiver: ReturnType<ApduReceiverServiceFactory> | null = null;
  let deviceSender: ReturnType<ApduSenderServiceFactory> | null = null;

  const device = {
    opened: true,
    transferOut: async (_endpoint: number, buffer: ArrayBuffer) => {
      const frame = new Uint8Array(buffer);
      if (!deviceReceiver || !deviceSender) {
        // The channel is the first two bytes of every Ledger USB frame.
        const channel = Maybe.of(frame.slice(0, 2));
        deviceReceiver = realReceiverFactory({ channel });
        deviceSender = realSenderFactory({ frameSize: FRAME_SIZE, channel, padding: true });
      }
      deviceReceiver.handleFrame(frame).map(maybeComplete =>
        maybeComplete.map(command => {
          receivedCommands.push(new Uint8Array([...command.data, ...command.statusCode]));
          const payload = new Uint8Array([...response.data, ...response.status]);
          for (const responseFrame of deviceSender!.getFrames(payload)) {
            outFrames.push(responseFrame.getRawData());
          }
        }),
      );
      return { status: "ok" as const };
    },
    transferIn: async (_endpoint: number, _length: number) => {
      const frame = await outFrames.pop();
      const copy = frame.slice();
      return { status: "ok" as const, data: new DataView(copy.buffer) };
    },
    releaseInterface: async () => {},
    close: async () => {},
  };

  return {
    device,
    getReceivedCommands: () => receivedCommands,
  };
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

describe("NodeWebUsbApduSender — real DMK framing round-trip", () => {
  function buildSender(device: unknown): NodeWebUsbApduSender {
    return new NodeWebUsbApduSender({
      dependencies: { device: device as never, interfaceNumber: 1 },
      apduSenderFactory: realSenderFactory,
      apduReceiverFactory: realReceiverFactory,
      loggerFactory: () => createLogger(),
    });
  }

  it("frames a command and reassembles a single-frame response (data + 0x9000)", async () => {
    const command = new Uint8Array([0xe0, 0x01, 0x00, 0x00]);
    const responseData = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    const responseStatus = new Uint8Array([0x90, 0x00]);
    const fake = createFakeLedgerDevice({ data: responseData, status: responseStatus });

    const result = await buildSender(fake.device).sendApdu(command);

    expect(result.isRight()).toBe(true);
    result.ifRight(response => {
      expect(Array.from(response.data)).toEqual(Array.from(responseData));
      expect(Array.from(response.statusCode)).toEqual(Array.from(responseStatus));
    });
    expect(fake.getReceivedCommands()).toHaveLength(1);
    expect(Array.from(fake.getReceivedCommands()[0]!)).toEqual(Array.from(command));
  });

  it("round-trips a multi-frame command and a multi-frame response", async () => {
    // 150-byte command and 300-byte response both exceed a single 64-byte frame,
    // forcing the framer/deframer to span multiple frames in both directions.
    const command = Uint8Array.from({ length: 150 }, (_, i) => i & 0xff);
    const responseData = Uint8Array.from({ length: 300 }, (_, i) => (i * 7) & 0xff);
    const responseStatus = new Uint8Array([0x90, 0x00]);
    const fake = createFakeLedgerDevice({ data: responseData, status: responseStatus });

    const result = await buildSender(fake.device).sendApdu(command);

    expect(result.isRight()).toBe(true);
    result.ifRight(response => {
      expect(Array.from(response.data)).toEqual(Array.from(responseData));
      expect(Array.from(response.statusCode)).toEqual(Array.from(responseStatus));
    });
    expect(Array.from(fake.getReceivedCommands()[0]!)).toEqual(Array.from(command));
  });

  it("surfaces a non-9000 status word as the response status code", async () => {
    const responseStatus = new Uint8Array([0x69, 0x85]); // conditions of use not satisfied
    const fake = createFakeLedgerDevice({ data: new Uint8Array(), status: responseStatus });

    const result = await buildSender(fake.device).sendApdu(new Uint8Array([0xe0, 0x02, 0x00, 0x00]));

    expect(result.isRight()).toBe(true);
    result.ifRight(response => {
      expect(Array.from(response.statusCode)).toEqual([0x69, 0x85]);
      expect(response.data).toHaveLength(0);
    });
  });
});

describe("NodeWebUsbApduSender — sendApdu error paths", () => {
  function buildSender(device: unknown): NodeWebUsbApduSender {
    return new NodeWebUsbApduSender({
      dependencies: { device: device as never, interfaceNumber: 1 },
      apduSenderFactory: realSenderFactory,
      apduReceiverFactory: realReceiverFactory,
      loggerFactory: () => createLogger(),
    });
  }

  const APDU = new Uint8Array([0xe0, 0x01, 0x00, 0x00]);

  it("returns Left when the device is not connected", async () => {
    const result = await buildSender({ opened: false }).sendApdu(APDU);
    expect(result.isLeft()).toBe(true);
    result.ifLeft(error => expect(error).toBeInstanceOf(OpeningConnectionError));
  });

  it("returns Left when transferOut reports a non-ok status", async () => {
    const device = {
      opened: true,
      transferOut: async () => ({ status: "stall" }),
    };
    const result = await buildSender(device).sendApdu(APDU);
    expect(result.isLeft()).toBe(true);
    result.ifLeft(error => {
      expect(error).toBeInstanceOf(OpeningConnectionError);
      expect(causeMessage(error)).toContain("transferOut status: stall");
    });
  });

  it("returns Left when transferOut throws", async () => {
    const device = {
      opened: true,
      transferOut: async () => {
        throw new Error("usb boom");
      },
    };
    const result = await buildSender(device).sendApdu(APDU);
    expect(result.isLeft()).toBe(true);
    result.ifLeft(error => expect(causeMessage(error)).toContain("usb boom"));
  });

  it("returns Left when transferIn reports a non-ok status", async () => {
    const device = {
      opened: true,
      transferOut: async () => ({ status: "ok" }),
      transferIn: async () => ({ status: "babble", data: undefined }),
    };
    const result = await buildSender(device).sendApdu(APDU);
    expect(result.isLeft()).toBe(true);
    result.ifLeft(error => {
      expect(error).toBeInstanceOf(OpeningConnectionError);
      expect(causeMessage(error)).toContain("transferIn status: babble");
    });
  });

  it("returns Left when transferIn throws", async () => {
    const device = {
      opened: true,
      transferOut: async () => ({ status: "ok" }),
      transferIn: async () => {
        throw new Error("usb read boom");
      },
    };
    const result = await buildSender(device).sendApdu(APDU);
    expect(result.isLeft()).toBe(true);
    result.ifLeft(error => {
      expect(error).toBeInstanceOf(OpeningConnectionError);
      expect(causeMessage(error)).toContain("usb read boom");
    });
  });

  it("returns Left when a received frame is rejected by the APDU receiver", async () => {
    const device = {
      opened: true,
      transferOut: async () => ({ status: "ok" }),
      transferIn: async () => ({
        status: "ok",
        data: new DataView(new Uint8Array(FRAME_SIZE).buffer),
      }),
    };
    const apduReceiverFactory = (() => ({
      handleFrame: () => Left(new OpeningConnectionError("malformed APDU frame")),
    })) as unknown as ApduReceiverServiceFactory;
    const sender = new NodeWebUsbApduSender({
      dependencies: { device: device as never, interfaceNumber: 1 },
      apduSenderFactory: realSenderFactory,
      apduReceiverFactory,
      loggerFactory: () => createLogger(),
    });

    const result = await sender.sendApdu(APDU);

    expect(result.isLeft()).toBe(true);
    result.ifLeft(error => {
      expect(error).toBeInstanceOf(OpeningConnectionError);
      expect(causeMessage(error)).toContain("malformed APDU frame");
    });
  });

  it("returns Left when a later transferOut fails after an earlier frame succeeds", async () => {
    const transferOutStatuses = ["ok", "stall"] as const;
    const transferredFrames: Uint8Array[] = [];
    const device = {
      opened: true,
      transferOut: async (_endpoint: number, buffer: ArrayBuffer) => {
        transferredFrames.push(new Uint8Array(buffer));
        return { status: transferOutStatuses[transferredFrames.length - 1] };
      },
    };
    const apduSenderFactory = (() => ({
      getFrames: () => [
        { getRawData: () => new Uint8Array([0xe0, 0x01, 0x00, 0x00]) },
        { getRawData: () => new Uint8Array([0xe0, 0x02, 0x00, 0x00]) },
      ],
    })) as unknown as ApduSenderServiceFactory;
    const sender = new NodeWebUsbApduSender({
      dependencies: { device: device as never, interfaceNumber: 1 },
      apduSenderFactory,
      apduReceiverFactory: realReceiverFactory,
      loggerFactory: () => createLogger(),
    });

    const result = await sender.sendApdu(APDU);

    expect(transferredFrames).toHaveLength(2);
    expect(result.isLeft()).toBe(true);
    result.ifLeft(error => {
      expect(error).toBeInstanceOf(OpeningConnectionError);
      expect(causeMessage(error)).toContain("transferOut status: stall");
    });
  });

  it("resolves with SendApduTimeoutError when the abort timeout fires", async () => {
    const device = {
      opened: true,
      transferOut: async () => ({ status: "ok" }),
      // Never resolves — only the abort timeout can settle the exchange.
      transferIn: () => new Promise<never>(() => {}),
    };
    const result = await buildSender(device).sendApdu(APDU, false, 5);
    expect(result.isLeft()).toBe(true);
    result.ifLeft(error => expect(error).toBeInstanceOf(SendApduTimeoutError));
  });
});

describe("NodeWebUsbApduSender — setupConnection", () => {
  function buildSender(device: unknown, interfaceNumber = 2): NodeWebUsbApduSender {
    return new NodeWebUsbApduSender({
      dependencies: { device: device as never, interfaceNumber },
      apduSenderFactory: realSenderFactory,
      apduReceiverFactory: realReceiverFactory,
      loggerFactory: () => createLogger(),
    });
  }

  it("opens the device, selects the configuration when missing, and claims the interface", async () => {
    const calls = { open: 0, selectConfiguration: 0, claimInterface: 0 };
    const device = {
      opened: false,
      configuration: null as unknown,
      open: async () => {
        calls.open += 1;
        device.opened = true;
      },
      selectConfiguration: async () => {
        calls.selectConfiguration += 1;
        device.configuration = { configurationValue: 1 };
      },
      reset: async () => {},
      claimInterface: async () => {
        calls.claimInterface += 1;
      },
      releaseInterface: async () => {},
      close: async () => {},
    };

    await buildSender(device).setupConnection();

    expect(calls.open).toBe(1);
    expect(calls.selectConfiguration).toBe(1);
    expect(calls.claimInterface).toBe(1);
  });

  it("releases, resets, closes, reopens, and claims when the device is already opened", async () => {
    const calls: string[] = [];
    const device = {
      opened: true,
      configuration: null as unknown,
      releaseInterface: async () => {
        calls.push("releaseInterface");
      },
      reset: async () => {
        calls.push("reset");
      },
      close: async () => {
        calls.push("close");
        device.opened = false;
      },
      open: async () => {
        calls.push("open");
        device.opened = true;
      },
      selectConfiguration: async () => {
        calls.push("selectConfiguration");
        device.configuration = { configurationValue: 1 };
      },
      claimInterface: async () => {
        calls.push("claimInterface");
      },
    };

    await buildSender(device).setupConnection();

    expect(calls).toEqual(
      process.platform === "win32"
        ? ["releaseInterface", "close", "open", "selectConfiguration", "claimInterface"]
        : [
            "releaseInterface",
            "reset",
            "close",
            "open",
            "selectConfiguration",
            "reset",
            "claimInterface",
          ],
    );
  });

  it("does not select a configuration when one already exists", async () => {
    const calls = { open: 0, selectConfiguration: 0, claimInterface: 0 };
    const device = {
      opened: false,
      configuration: { configurationValue: 1 } as unknown,
      open: async () => {
        calls.open += 1;
        device.opened = true;
      },
      selectConfiguration: async () => {
        calls.selectConfiguration += 1;
      },
      reset: async () => {},
      claimInterface: async () => {
        calls.claimInterface += 1;
      },
      releaseInterface: async () => {},
      close: async () => {},
    };

    await buildSender(device).setupConnection();

    expect(calls.open).toBe(1);
    expect(calls.selectConfiguration).toBe(0);
    expect(calls.claimInterface).toBe(1);
  });

  it("waits for an in-flight close before reopening and reclaiming the device", async () => {
    const calls: string[] = [];
    let finishRelease: (() => void) | undefined;
    let releaseStartedResolve: (() => void) | undefined;
    const releaseStarted = new Promise<void>(resolve => {
      releaseStartedResolve = resolve;
    });
    const device = {
      opened: true,
      configuration: { configurationValue: 1 } as unknown,
      releaseInterface: async () => {
        calls.push("releaseInterface");
        releaseStartedResolve?.();
        await new Promise<void>(releaseResolve => {
          finishRelease = releaseResolve;
        });
      },
      close: async () => {
        calls.push("close");
        device.opened = false;
      },
      reset: async () => {
        calls.push("reset");
      },
      open: async () => {
        calls.push("open");
        device.opened = true;
      },
      selectConfiguration: async () => {
        calls.push("selectConfiguration");
      },
      claimInterface: async () => {
        calls.push("claimInterface");
      },
    };
    const sender = buildSender(device);
    const closePromise = sender.closeConnection();

    await releaseStarted;
    const setupPromise = sender.setupConnection();
    await flushTasks();
    expect(calls).toEqual(["releaseInterface"]);
    finishRelease?.();
    await closePromise;
    await setupPromise;
    expect(calls).toEqual(
      process.platform === "win32"
        ? ["releaseInterface", "close", "open", "claimInterface"]
        : ["releaseInterface", "close", "open", "reset", "claimInterface"],
    );
  });

  it("closes the device and rethrows when claiming the interface fails", async () => {
    let closeCalls = 0;
    const device = {
      opened: false,
      configuration: { configurationValue: 1 } as unknown,
      open: async () => {
        device.opened = true;
      },
      selectConfiguration: async () => {},
      reset: async () => {},
      claimInterface: async () => {
        throw new Error("claim failed");
      },
      releaseInterface: async () => {},
      close: async () => {
        closeCalls += 1;
      },
    };

    await expect(buildSender(device).setupConnection()).rejects.toThrow("claim failed");
    expect(closeCalls).toBe(1);
  });
});

describe("NodeWebUsbApduSender — closeConnection", () => {
  function buildSender(
    device: unknown,
    loggerFactory: (tag: string) => LoggerPublisherService = () => createLogger(),
  ): NodeWebUsbApduSender {
    return new NodeWebUsbApduSender({
      dependencies: { device: device as never, interfaceNumber: 1 },
      apduSenderFactory: realSenderFactory,
      apduReceiverFactory: realReceiverFactory,
      loggerFactory,
      closeReadLoopTimeoutMs: 5,
    });
  }

  it("is idempotent for concurrent close calls", async () => {
    let releaseCalls = 0;
    let closeCalls = 0;
    let finishRelease: (() => void) | undefined;
    let releaseStartedResolve: (() => void) | undefined;
    const releaseStarted = new Promise<void>(resolve => {
      releaseStartedResolve = resolve;
    });
    const device = {
      opened: true,
      releaseInterface: async () => {
        releaseCalls += 1;
        releaseStartedResolve?.();
        await new Promise<void>(releaseResolve => {
          finishRelease = releaseResolve;
        });
      },
      close: async () => {
        closeCalls += 1;
        device.opened = false;
      },
    };
    const sender = buildSender(device);
    const firstClose = sender.closeConnection();
    const secondClose = sender.closeConnection();

    await releaseStarted;
    await flushTasks();
    expect(releaseCalls).toBe(1);
    expect(closeCalls).toBe(0);
    finishRelease?.();
    await Promise.all([firstClose, secondClose]);
    expect(releaseCalls).toBe(1);
    expect(closeCalls).toBe(1);
  });

  it("resolves a pending APDU while swallowing release errors and logging close errors", async () => {
    let closeErrors = 0;
    let transferInStarted: (() => void) | undefined;
    const transferInStartedPromise = new Promise<void>(resolve => {
      transferInStarted = resolve;
    });
    const device = {
      opened: true,
      transferOut: async () => ({ status: "ok" }),
      transferIn: () => {
        transferInStarted?.();
        return new Promise<never>(() => {});
      },
      releaseInterface: async () => {
        throw new Error("release failed");
      },
      close: async () => {
        throw new Error("close failed");
      },
    };
    const sender = buildSender(device, () =>
      createLogger({
        error: () => {
          closeErrors += 1;
        },
      }),
    );

    const sendPromise = sender.sendApdu(new Uint8Array([0xe0, 0x01, 0x00, 0x00]));
    await transferInStartedPromise;
    const closePromise = sender.closeConnection();
    const sendResult = await sendPromise;
    await closePromise;

    expect(sendResult.isLeft()).toBe(true);
    sendResult.ifLeft(error => expect(error).toBeInstanceOf(OpeningConnectionError));
    expect(closeErrors).toBe(1);
  });
});
