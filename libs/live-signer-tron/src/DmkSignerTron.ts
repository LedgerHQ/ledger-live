import { lastValueFrom } from "rxjs";
import {
  DeviceActionState,
  DeviceActionStatus,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import {
  SignerTrxBuilder,
  type GetAddressDAError,
  type SignTransactionDAError,
  type SignerTrx,
} from "@ledgerhq/device-signer-kit-tron";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/hw-transport/errors";
import type { TronAddress, TronSignature, TronSigner } from "./types";

type DAError = GetAddressDAError | SignTransactionDAError;

export class DmkSignerTron implements TronSigner {
  private readonly signer: SignerTrx;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    this.signer = new SignerTrxBuilder({ dmk, sessionId }).build();
  }

  private _mapError<E extends DAError>(error: E): Error {
    if (!("errorCode" in error)) {
      return new Error(error._tag);
    }

    switch (error.errorCode) {
      case "5515":
        return new LockedDeviceError();
      case "6982":
      case "6985":
        return new UserRefusedOnDevice();
      default:
        return new Error(error._tag);
    }
  }

  private _mapResult<T, E extends DAError>(actionState: DeviceActionState<T, E, unknown>): T {
    switch (actionState.status) {
      case DeviceActionStatus.Completed: {
        return actionState.output;
      }
      case DeviceActionStatus.Error: {
        throw this._mapError<E>(actionState.error);
      }
      case DeviceActionStatus.NotStarted:
      case DeviceActionStatus.Pending:
      case DeviceActionStatus.Stopped:
      default: {
        throw new Error("Unknown device action status");
      }
    }
  }

  async getAddress(path: string, boolDisplay?: boolean): Promise<TronAddress> {
    const { observable } = this.signer.getAddress(path, {
      checkOnDevice: !!boolDisplay,
      skipOpenApp: true,
    });

    const address = this._mapResult(await lastValueFrom(observable));

    return {
      publicKey: address.publicKey,
      address: address.address,
    };
  }

  async sign(path: string, rawTxHex: string): Promise<TronSignature> {
    const transaction = Buffer.from(rawTxHex, "hex");

    const { observable } = this.signer.signTransaction(path, transaction, {
      skipOpenApp: true,
    });

    const signature = this._mapResult(await lastValueFrom(observable));

    return Buffer.from(signature).toString("hex");
  }
}
