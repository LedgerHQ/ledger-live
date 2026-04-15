import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import HwTransport from "@ledgerhq/hw-transport";

const TransportClass =
  HwTransport as unknown as abstract new () => import("@ledgerhq/hw-transport").default;

/** Default APDU abort so a stuck USB exchange cannot block the CLI indefinitely (see DMK `abortTimeout`). */
const WALLET_CLI_DEFAULT_APDU_ABORT_MS = 120_000;

/**
 * hw-transport compatible with live-common {@link isDmkTransport} (exposes `dmk` + `sessionId`).
 */
export class WalletCliDmkTransport extends TransportClass {
  readonly dmk: DeviceManagementKit;
  sessionId: string;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    super();
    this.dmk = dmk;
    this.sessionId = sessionId;
  }

  async exchange(
    apdu: Buffer,
    { abortTimeoutMs }: { abortTimeoutMs?: number } = {},
  ): Promise<Buffer> {
    const { data, statusCode } = await this.dmk.sendApdu({
      sessionId: this.sessionId,
      apdu: new Uint8Array(apdu.buffer, apdu.byteOffset, apdu.byteLength),
      abortTimeout: abortTimeoutMs ?? WALLET_CLI_DEFAULT_APDU_ABORT_MS,
    });
    return Buffer.from([...data, ...statusCode]);
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}
