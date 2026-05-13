import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import Transport from "@ledgerhq/hw-transport";

/**
 * Minimal hw-transport adapter over an existing DMK session.
 *
 * This is intentionally limited to APDU bridging for flows that already own
 * the DMK session lifecycle.
 */
export class DmkCompatTransport extends Transport {
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
      abortTimeout: abortTimeoutMs,
    });

    return Buffer.from([...data, ...statusCode]);
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}
