import semver from "semver";
import Transport from "@ledgerhq/hw-transport";
import { UpdateYourApp } from "@ledgerhq/errors";
import {
  CantonSigner,
  CantonAddress,
  CantonSignature,
  CantonPreparedTransaction,
  CantonUntypedVersionedMessage,
} from "@ledgerhq/coin-canton";
import Canton from "@ledgerhq/hw-app-canton";

/**
 * Required minimum version of App Canton.
 * App Canton only supports Nano X, Nano S+, Stax, and Flex devices.
 * NanoS (original) is not supported.
 */
const MIN_VERSION = "2.9.1";
const MANAGER_APP_NAME = "Canton";

export class LegacySignerCanton implements CantonSigner {
  private signer: Canton;

  constructor(transport: Transport) {
    this.signer = new Canton(transport);
  }

  async getAppConfiguration(): Promise<{ version: string }> {
    return this.signer.getAppConfiguration();
  }

  private async checkAppVersion() {
    const { version } = await this.getAppConfiguration();
    const outdated = semver.lt(version, MIN_VERSION);

    if (outdated) {
      throw new UpdateYourApp(undefined, {
        managerAppName: MANAGER_APP_NAME,
      });
    }
    return !outdated;
  }

  async getAddress(path: string, display: boolean = false): Promise<CantonAddress> {
    await this.checkAppVersion();
    return this.signer.getAddress(path, display);
  }

  async signTransaction(
    path: string,
    data: CantonPreparedTransaction | CantonUntypedVersionedMessage | string,
  ): Promise<CantonSignature> {
    await this.checkAppVersion();
    return this.signer.signTransaction(path, data);
  }
}
