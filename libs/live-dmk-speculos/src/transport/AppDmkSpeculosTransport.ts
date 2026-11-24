import Transport from "@ledgerhq/hw-transport";
import type { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";
import { firstValueFrom } from "rxjs";
import { filter, timeout } from "rxjs/operators";
import { withTransientHttpRetries } from "./speculosTransientHttpRetry";

const DEFAULT_DISCOVERY_TIMEOUT_MS = 10_000;

function findConnectedSessionId(dmk: DeviceManagementKit): string | undefined {
  return dmk.listConnectedDevices().find(device => device.transport === speculosIdentifier)
    ?.sessionId;
}

async function connectSpeculos(dmk: DeviceManagementKit, timeoutMs: number): Promise<string> {
  const devices = await firstValueFrom<DiscoveredDevice[]>(
    dmk.listenToAvailableDevices({ transport: speculosIdentifier }).pipe(
      filter(list => list.length > 0),
      timeout(timeoutMs),
    ),
  );

  return withTransientHttpRetries("speculos-dmk-connect", () =>
    dmk.connect({
      device: devices[0],
      sessionRefresherOptions: { isRefresherDisabled: true },
    }),
  );
}

/**
 * `withDevice` transport of the e2e Speculos target, on the DMK of the app. Like the HID and BLE
 * transports, it reuses an open session, so a Device Intent job that signs through `withDevice`
 * stays on its own session instead of connecting a second one mid-flow.
 */
export class AppDmkSpeculosTransport extends Transport {
  private static connecting: Promise<string> | null = null;

  readonly dmk: DeviceManagementKit;
  sessionId: string;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    super();
    this.dmk = dmk;
    this.sessionId = sessionId;
  }

  static async open(
    dmk: DeviceManagementKit,
    timeoutMs: number = DEFAULT_DISCOVERY_TIMEOUT_MS,
  ): Promise<AppDmkSpeculosTransport> {
    const sessionId =
      findConnectedSessionId(dmk) ?? (await AppDmkSpeculosTransport.connect(dmk, timeoutMs));

    return new AppDmkSpeculosTransport(dmk, sessionId);
  }

  private static connect(dmk: DeviceManagementKit, timeoutMs: number): Promise<string> {
    AppDmkSpeculosTransport.connecting ??= connectSpeculos(dmk, timeoutMs).finally(() => {
      AppDmkSpeculosTransport.connecting = null;
    });

    return AppDmkSpeculosTransport.connecting;
  }

  async exchange(
    apdu: Buffer,
    { abortTimeoutMs }: { abortTimeoutMs?: number } = {},
  ): Promise<Buffer> {
    const { data, statusCode } = await withTransientHttpRetries("speculos-send-apdu", () =>
      this.dmk.sendApdu({
        sessionId: this.sessionId,
        apdu: new Uint8Array(apdu.buffer, apdu.byteOffset, apdu.byteLength),
        abortTimeout: abortTimeoutMs,
      }),
    );

    return Buffer.from([...data, ...statusCode]);
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}
