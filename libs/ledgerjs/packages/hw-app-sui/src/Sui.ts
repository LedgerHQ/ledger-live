import SuiUpstream from "@mysten/ledgerjs-hw-app-sui";
import { DeviceModelId } from "@ledgerhq/devices";
import { UpdateYourApp } from "@ledgerhq/errors";
import semver from "semver";

import type {
  GetPublicKeyResult,
  SignTransactionResult,
  GetVersionResult,
  Resolution,
  AppConfig,
} from "@mysten/ledgerjs-hw-app-sui";

const MIN_VERSION = "1.5.4";
const MANAGER_APP_NAME = "Sui";

export default class Sui extends SuiUpstream {
  async signTransaction(
    path: string,
    txn: Uint8Array,
    options?: { bcsObjects: Uint8Array[] },
    resolution?: Resolution,
  ): Promise<SignTransactionResult> {
    if (
      resolution &&
      resolution.deviceModelId &&
      resolution.deviceModelId !== DeviceModelId.nanoS
    ) {
      const { major, minor, patch } = await this.getVersion();
      if (semver.lt(`${major}.${minor}.${patch}`, MIN_VERSION)) {
        throw new UpdateYourApp(undefined, { managerAppName: MANAGER_APP_NAME });
      }
    }
    return super.signTransaction(path, txn, options, resolution);
  }
}

export type {
  GetPublicKeyResult,
  SignTransactionResult,
  GetVersionResult,
  Resolution,
  AppConfig,
};
