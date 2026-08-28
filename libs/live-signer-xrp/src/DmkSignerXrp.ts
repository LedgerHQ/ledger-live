import { lastValueFrom } from "rxjs";
import {
  DeviceActionState,
  DeviceActionStatus,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import {
  SignerXrpBuilder,
  type GetAddressDAError,
  type SignTransactionDAError,
  type SignerXrp,
} from "@ledgerhq/device-signer-kit-xrp";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/hw-transport/errors";
import type { XrpAddress, XrpSignature, XrpSigner } from "./types";

type DAError = GetAddressDAError | SignTransactionDAError;

export class DmkSignerXrp implements XrpSigner {
  private readonly signer: SignerXrp;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    this.signer = new SignerXrpBuilder({ dmk, sessionId }).build();
  }

  private _mapError<E extends DAError>(error: E): Error {
    if (!("errorCode" in error)) {
      return new Error(error._tag);
    }

    switch (error.errorCode) {
      case "5515":
        return new LockedDeviceError();
      case "6985":
      case "6982":
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

  /**
   * The signer kit drives the XRP app on secp256k1 only — its APDUs pin `p2` to the secp256k1
   * curve mask. Refuse rather than sign on a curve the caller did not ask for: the app answers
   * happily either way, so a silent fallback would return a signature for the wrong key.
   */
  private _rejectEd25519(ed25519?: boolean): void {
    if (ed25519) {
      throw new Error("DmkSignerXrp: the XRP signer kit does not support the ed25519 curve yet");
    }
  }

  async getAddress(
    path: string,
    display?: boolean,
    chainCode?: boolean,
    ed25519?: boolean,
  ): Promise<XrpAddress> {
    this._rejectEd25519(ed25519);

    const { observable } = this.signer.getAddress(path, {
      checkOnDevice: !!display,
      returnChainCode: !!chainCode,
      // Ledger Live opens the app itself before it reaches the signer.
      skipOpenApp: true,
    });

    const address = this._mapResult(await lastValueFrom(observable));

    return {
      publicKey: address.publicKey,
      address: address.address,
      chainCode: address.chainCode,
    };
  }

  async signTransaction(path: string, rawTxHex: string, ed25519?: boolean): Promise<XrpSignature> {
    this._rejectEd25519(ed25519);

    // Passed through unchanged: the XRP app prepends the `53545800` signing prefix itself.
    const transaction = Buffer.from(rawTxHex, "hex");

    const { observable } = this.signer.signTransaction(path, transaction, {
      skipOpenApp: true,
    });

    const signature = this._mapResult(await lastValueFrom(observable));

    return Buffer.from(signature).toString("hex");
  }
}
