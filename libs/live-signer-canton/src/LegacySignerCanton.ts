import semver from "semver";
import Transport from "@ledgerhq/hw-transport";
import { DeviceModelId } from "@ledgerhq/devices";
import { UpdateYourApp } from "@ledgerhq/errors";
import { CantonSigner, CantonAddress, CantonSignature } from "@ledgerhq/coin-canton";
import Canton from "@ledgerhq/hw-app-canton";

/**
 * Required minimum version of App Canton for non NanoS devices.
 * For NanoS devices (being deprecated), all versions of App Canton
 * are outdated compared to what we want to enforce in the other cases.
 * As a result, Firebase `minVersion` can not be used here.
 * NOTE: The ability to specify a `minVersion` per device model from Firebase
 * is work in progress {@link https://ledgerhq.atlassian.net/browse/LIVE-17027}
 */
const MIN_VERSION = "0.1.0";
const MANAGER_APP_NAME = "Canton";

export class LegacySignerCanton implements CantonSigner {
  private signer: Canton;
  private transport: Transport;

  constructor(transport: Transport) {
    this.signer = new Canton(transport);
    this.transport = transport;
  }

  async getAppConfiguration(): Promise<{ version: string }> {
    return this.signer.getAppConfiguration();
  }

  private async checkAppVersion(
    minVersion: string,
    { throwOnOutdated }: { throwOnOutdated: boolean },
  ) {
    const { version } = await this.getAppConfiguration();
    const outdated = semver.lt(version, minVersion);

    if (outdated && throwOnOutdated) {
      throw new UpdateYourApp(undefined, {
        managerAppName: MANAGER_APP_NAME,
      });
    }
    return !outdated;
  }

  async getAddress(path: string): Promise<CantonAddress> {
    if (this.transport.deviceModel?.id !== DeviceModelId.nanoS) {
      await this.checkAppVersion(MIN_VERSION, { throwOnOutdated: true });
    }

    return this.signer.getAddress(path);
  }

  async signTransaction(path: string, rawTx: string): Promise<CantonSignature> {
    if (this.transport.deviceModel?.id !== DeviceModelId.nanoS) {
      await this.checkAppVersion(MIN_VERSION, { throwOnOutdated: true });
    }

    return this.signer.signTransaction(path, rawTx);
  }
}
