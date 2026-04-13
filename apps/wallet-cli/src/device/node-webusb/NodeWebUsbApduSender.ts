import {
  formatApduReceivedLog,
  formatApduSentLog,
  FramerUtils,
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

export type NodeWebUsbApduSenderDependencies = {
  device: USBDevice;
  interfaceNumber: number;
};

export type NodeWebUsbApduSenderConstructorArgs = {
  dependencies: NodeWebUsbApduSenderDependencies;
  apduSenderFactory: ApduSenderServiceFactory;
  apduReceiverFactory: ApduReceiverServiceFactory;
  loggerFactory: (tag: string) => LoggerPublisherService;
};

async function gracefullyResetDevice(device: USBDevice): Promise<void> {
  try {
    await device.reset();
  } catch {
    // Same as hw-transport-webusb: reset is best-effort
  }
}

function bufferFromInTransfer(data: DataView): Uint8Array {
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
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

  constructor({
    dependencies,
    apduSenderFactory,
    apduReceiverFactory,
    loggerFactory,
  }: NodeWebUsbApduSenderConstructorArgs) {
    const channel = Maybe.of(FramerUtils.numberToByteArray(Math.floor(Math.random() * 0xffff), 2));
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
    const { device, interfaceNumber } = this.dependencies;

    if (device.opened) {
      try {
        await device.releaseInterface(interfaceNumber);
      } catch {
        // ignore
      }
      try {
        await gracefullyResetDevice(device);
        await device.close();
      } catch {
        // ignore
      }
    }

    await device.open();

    if (device.configuration === null) {
      await device.selectConfiguration(LEDGER_WEBUSB_CONFIGURATION_VALUE);
    }

    await gracefullyResetDevice(device);

    try {
      await device.claimInterface(interfaceNumber);
    } catch (e) {
      await device.close().catch(() => {});
      throw e;
    }

    this.logger.info("Connected to device (WebUSB)");
  }

  async closeConnection(): Promise<void> {
    const { device, interfaceNumber } = this.dependencies;
    this.readLoopGeneration++;
    this.sendApduPromiseResolver = Nothing;
    this.abortTimeout.map(t => {
      this.abortTimeout = Nothing;
      clearTimeout(t);
    });

    if (!device.opened) {
      return;
    }

    try {
      await device.releaseInterface(interfaceNumber);
    } catch {
      // ignore
    }
    try {
      await gracefullyResetDevice(device);
      await device.close();
    } catch (e) {
      this.logger.error("Error while closing WebUSB device", { data: { error: e } });
    }
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
        const result = await device.transferOut(LEDGER_WEBUSB_ENDPOINT_NUMBER, out);
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
    void this.receiveResponseFrames(device, generation);

    return completion;
  }

  /**
   * Reads USB bulk-in frames until a complete APDU response is assembled or the
   * exchange is cancelled (timeout / close). Runs detached from {@link sendApdu}
   * so that the abort timeout can resolve the caller's promise even when
   * `transferIn` is blocked.
   */
  private async receiveResponseFrames(device: USBDevice, generation: number): Promise<void> {
    try {
      while (this.sendApduPromiseResolver.isJust() && this.readLoopGeneration === generation) {
        const r = await device.transferIn(LEDGER_WEBUSB_ENDPOINT_NUMBER, FRAME_SIZE);
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
