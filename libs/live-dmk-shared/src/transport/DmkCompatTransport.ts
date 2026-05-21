import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import _Transport from "@ledgerhq/hw-transport";

// Node.js 22 ESM/CJS interop: when this ESM module is loaded via require()
// (importSyncForRequire), hw-transport resolves to its CJS build where
// module.exports = { default: Transport, … }.  The ESM default import then
// receives the whole exports object rather than the class.  Unwrap it here.
const Transport = ((_Transport as { default?: typeof _Transport }).default ??
  _Transport) as typeof _Transport;

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
