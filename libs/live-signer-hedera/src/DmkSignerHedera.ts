import type { HederaSigner } from "@ledgerhq/coin-hedera/types";
import {
  DeviceActionStatus,
  type DeviceActionState,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import {
  LockedDeviceError,
  UserRefusedAddress,
  UserRefusedOnDevice,
} from "@ledgerhq/hw-transport/errors";
import { lastValueFrom } from "rxjs";
import { SignerHederaBuilder, type HederaDAError, type SignerHedera } from "./kit/SignerHedera";

const LEDGER_LIVE_HEDERA_PATH = "44/3030";
const HEDERA_KEY_INDEX = 0;

export const toKeyIndex = (path: string): number => {
  if (path.replace(/^m\//, "") !== LEDGER_LIVE_HEDERA_PATH) {
    throw new Error(`Unsupported Hedera derivation path: ${path}`);
  }
  return HEDERA_KEY_INDEX;
};

export class DmkSignerHedera implements HederaSigner {
  private readonly signer: SignerHedera;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    this.signer = new SignerHederaBuilder({ dmk, sessionId }).build();
  }

  async getPublicKey(path: string): Promise<string> {
    const { observable } = this.signer.getPublicKey(toKeyIndex(path), { skipOpenApp: true });
    try {
      return this._mapResult(await lastValueFrom(observable));
    } catch (e) {
      throw e instanceof UserRefusedOnDevice ? new UserRefusedAddress() : e;
    }
  }

  async signTransaction(transaction: Uint8Array): Promise<Uint8Array> {
    const { observable } = this.signer.signTransaction(HEDERA_KEY_INDEX, transaction, {
      skipOpenApp: true,
    });
    return this._mapResult(await lastValueFrom(observable));
  }

  private _mapResult<T>(state: DeviceActionState<T, HederaDAError, unknown>): T {
    switch (state.status) {
      case DeviceActionStatus.Completed:
        return state.output;
      case DeviceActionStatus.Error:
        throw this._mapError(state.error);
      default:
        throw new Error("Unexpected device action status");
    }
  }

  private _mapError(error: HederaDAError): Error {
    if (!("errorCode" in error)) {
      return new Error(error._tag);
    }
    switch (error.errorCode) {
      case "5515":
        return new LockedDeviceError();
      case "6985":
        return new UserRefusedOnDevice();
      default:
        return new Error(`${error._tag} (errorCode: ${error.errorCode})`);
    }
  }
}
