import {
  formatApduReceivedLog,
  formatApduSentLog,
  OpeningConnectionError,
  SendApduTimeoutError,
} from "@ledgerhq/device-management-kit";
import type {
  ApduReceiverServiceFactory,
  ApduSenderServiceFactory,
  DeviceApduSender,
  LoggerPublisherService,
  SendApduResult,
} from "@ledgerhq/device-management-kit";
import { Just, Left, Maybe, Nothing, Right } from "purify-ts";
import {
  FRAME_SIZE,
  LEDGER_WEBUSB_CONFIGURATION_VALUE,
  LEDGER_WEBUSB_ENDPOINT_NUMBER,
} from "./node-webusb-constants";

const CLOSE_READ_LOOP_TIMEOUT_MS = 1_000;

// node-usb defaults transfers to a 1s timeout and cancels them at once with 0; reads wait for the user.
const IN_TRANSFER_TIMEOUT_MS = 2_147_483_647;
const OUT_TRANSFER_TIMEOUT_MS = 10_000;

/** A WebUSB device from node-usb, whose transfers take an extra timeout argument. */
export type NodeUsbDevice = USBDevice & {
  transferIn(
    endpointNumber: number,
    length: number,
    timeout?: number,
  ): Promise<USBInTransferResult>;
  transferOut(
    endpointNumber: number,
    data: BufferSource,
    timeout?: number,
  ): Promise<USBOutTransferResult>;
};

export type NodeWebUsbApduSenderDependencies = {
  device: NodeUsbDevice;
  interfaceNumber: number;
};

export type NodeWebUsbApduSenderConstructorArgs = {
  dependencies: NodeWebUsbApduSenderDependencies;
  apduSenderFactory: ApduSenderServiceFactory;
  apduReceiverFactory: ApduReceiverServiceFactory;
  loggerFactory: (tag: string) => LoggerPublisherService;
  closeReadLoopTimeoutMs?: number;
};

function bufferFromInTransfer(data: DataView): Uint8Array {
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

async function awaitReadLoopClose(
  readLoopPromise: Promise<void> | null,
  timeoutMs: number,
): Promise<void> {
  if (!readLoopPromise) {
    return;
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<void>(resolve => {
    timer = setTimeout(resolve, timeoutMs);
  });

  try {
    await Promise.race([readLoopPromise.catch(() => undefined), timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** DMK device APDU sender over Ledger WebUSB bulk endpoints (node-usb WebUSB API, same framing as hw-transport-webusb). */
export class NodeWebUsbApduSender implements DeviceApduSender<NodeWebUsbApduSenderDependencies> {
  private dependencies: NodeWebUsbApduSenderDependencies;
  private readonly apduSenderFactory: ApduSenderServiceFactory;
  private readonly apduSender: ReturnType<ApduSenderServiceFactory>;
  private readonly apduReceiverFactory: ApduReceiverServiceFactory;
  private readonly apduReceiver: ReturnType<ApduReceiverServiceFactory>;
  private readonly logger: LoggerPublisherService;
  private sendApduPromiseResolver: Maybe<(result: SendApduResult) => void> = Nothing;
  private abortTimeout: Maybe<ReturnType<typeof setTimeout>> = Nothing;
  private readLoopGeneration = 0;
  private readLoopPromise: Promise<void> | null = null;
  private closeConnectionPromise: Promise<void> | null = null;
  private readonly closeReadLoopTimeoutMs: number;
  private readonly channel: Uint8Array;

  constructor({
    dependencies,
    apduSenderFactory,
    apduReceiverFactory,
    loggerFactory,
    closeReadLoopTimeoutMs = CLOSE_READ_LOOP_TIMEOUT_MS,
  }: NodeWebUsbApduSenderConstructorArgs) {
    this.channel = crypto.getRandomValues(new Uint8Array(2));
    const channel = Maybe.of(this.channel);
    this.dependencies = dependencies;
    this.apduSenderFactory = apduSenderFactory;
    this.apduSender = this.apduSenderFactory({
      frameSize: FRAME_SIZE,
      channel,
      padding: true,
    });
    this.apduReceiverFactory = apduReceiverFactory;
    this.apduReceiver = this.apduReceiverFactory({ channel });
    this.logger = loggerFactory("NodeWebUsbApduSender");
    this.closeReadLoopTimeoutMs = closeReadLoopTimeoutMs;
  }

  getDependencies(): NodeWebUsbApduSenderDependencies {
    return this.dependencies;
  }

  setDependencies(dependencies: NodeWebUsbApduSenderDependencies): void {
    this.dependencies = dependencies;
  }

  private resolvePendingApdu(result: SendApduResult): void {
    this.abortTimeout.map(t => {
      this.abortTimeout = Nothing;
      clearTimeout(t);
    });
    this.sendApduPromiseResolver.map(resolve => {
      this.sendApduPromiseResolver = Nothing;
      resolve(result);
    });
  }

  async setupConnection(): Promise<void> {
    if (this.closeConnectionPromise) {
      await this.closeConnectionPromise;
    }

    const { device, interfaceNumber } = this.dependencies;

    if (device.opened) {
      try {
        await device.releaseInterface(interfaceNumber);
      } catch {
        // ignore
      }
      try {
        await device.close();
      } catch {
        // ignore
      }
    }

    await device.open();

    if (!device.configuration) {
      await device.selectConfiguration(LEDGER_WEBUSB_CONFIGURATION_VALUE);
    }

    // No reset(): with node-usb 3 (nusb) it re-enumerates the device and invalidates this handle.
    try {
      await device.claimInterface(interfaceNumber);
    } catch (e) {
      await device.close().catch(() => {});
      throw e;
    }

    this.logger.info("Connected to device (WebUSB)");
  }

  closeConnection(): Promise<void> {
    if (this.closeConnectionPromise) {
      return this.closeConnectionPromise;
    }

    const closePromise = this.closeConnectionInternal().finally(() => {
      if (this.closeConnectionPromise === closePromise) {
        this.closeConnectionPromise = null;
      }
    });
    this.closeConnectionPromise = closePromise;
    return closePromise;
  }

  private async closeConnectionInternal(): Promise<void> {
    const { device, interfaceNumber } = this.dependencies;
    this.readLoopGeneration++;
    const readLoopPromise = this.readLoopPromise;
    this.resolvePendingApdu(Left(new OpeningConnectionError("WebUSB connection closed")));

    if (!device.opened) {
      await awaitReadLoopClose(readLoopPromise, this.closeReadLoopTimeoutMs);
      return;
    }

    try {
      await device.releaseInterface(interfaceNumber);
    } catch {
      // ignore
    }
    try {
      await device.close();
    } catch (e) {
      this.logger.error("Error while closing WebUSB device", { data: { error: e } });
    }
    await awaitReadLoopClose(readLoopPromise, this.closeReadLoopTimeoutMs);
    this.logger.info("Disconnect (WebUSB)");
  }

  async sendApdu(
    apdu: Uint8Array,
    _triggersDisconnection?: boolean,
    abortTimeoutMs?: number,
  ): Promise<SendApduResult> {
    const { device } = this.dependencies;

    if (!device.opened) {
      return Left(new OpeningConnectionError("Device not connected"));
    }

    const completion = new Promise<SendApduResult>(resolve => {
      this.sendApduPromiseResolver = Just(resolve);
    });

    for (const frame of this.apduSender.getFrames(apdu)) {
      try {
        const raw = frame.getRawData();
        const out = new Uint8Array(raw.byteLength);
        out.set(raw);
        const result = await device.transferOut(
          LEDGER_WEBUSB_ENDPOINT_NUMBER,
          out.buffer,
          OUT_TRANSFER_TIMEOUT_MS,
        );
        if (result.status !== "ok") {
          this.resolvePendingApdu(
            Left(new OpeningConnectionError(`WebUSB transferOut status: ${result.status}`)),
          );
          return completion;
        }
      } catch (e) {
        this.logger.info("Error sending WebUSB frame", { data: { error: e } });
        this.resolvePendingApdu(Left(new OpeningConnectionError(String(e))));
        return completion;
      }
    }

    this.logger.debug(formatApduSentLog(apdu));

    if (abortTimeoutMs) {
      this.abortTimeout = Just(
        setTimeout(() => {
          this.logger.debug("[sendApdu] Abort timeout", { data: { abortTimeout: abortTimeoutMs } });
          this.resolvePendingApdu(Left(new SendApduTimeoutError("Abort timeout")));
        }, abortTimeoutMs),
      );
    }

    const generation = ++this.readLoopGeneration;
    const readLoopPromise = this.receiveResponseFrames(device, generation).finally(() => {
      if (this.readLoopPromise === readLoopPromise) {
        this.readLoopPromise = null;
      }
    });
    this.readLoopPromise = readLoopPromise;

    return completion;
  }

  /**
   * Reads USB bulk-in frames until a complete APDU response is assembled or the
   * exchange is cancelled (timeout / close). Runs detached from {@link sendApdu}
   * so that the abort timeout can resolve the caller's promise even when
   * `transferIn` is blocked.
   */
  private async receiveResponseFrames(device: NodeUsbDevice, generation: number): Promise<void> {
    try {
      while (this.sendApduPromiseResolver.isJust() && this.readLoopGeneration === generation) {
        const r = await device.transferIn(
          LEDGER_WEBUSB_ENDPOINT_NUMBER,
          FRAME_SIZE,
          IN_TRANSFER_TIMEOUT_MS,
        );
        if (this.readLoopGeneration !== generation) {
          break;
        }
        if (r.status !== "ok" || !r.data) {
          this.resolvePendingApdu(
            Left(new OpeningConnectionError(`WebUSB transferIn status: ${r.status}`)),
          );
          break;
        }
        const chunk = bufferFromInTransfer(r.data);
        // Without reset(), a killed session's frames can still be queued; they carry another channel.
        if (chunk[0] !== this.channel[0] || chunk[1] !== this.channel[1]) {
          this.logger.debug("[receiveResponseFrames] Dropping frame from another channel");
          continue;
        }
        this.apduReceiver
          .handleFrame(chunk)
          .map(maybeResponse => {
            maybeResponse.map(response => {
              this.logger.debug(formatApduReceivedLog(response));
              this.resolvePendingApdu(Right(response));
            });
          })
          .mapLeft(err => {
            this.resolvePendingApdu(Left(err));
          });
      }
    } catch (e) {
      if (this.readLoopGeneration === generation) {
        this.resolvePendingApdu(Left(new OpeningConnectionError(String(e))));
      }
    }
  }
}
