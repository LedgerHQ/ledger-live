import type {
  CasperGetAddrResponse,
  CasperSignature,
  CasperSigner,
} from "@ledgerhq/coin-casper/types";
import {
  DeviceActionStatus,
  type DeviceActionState,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import {
  type GetAddressDAError,
  type SignerCasper,
  SignerCasperBuilder,
  type SignTransactionDAError,
} from "@ledgerhq/device-signer-kit-casper";
import {
  LockedDeviceError,
  UserRefusedAddress,
  UserRefusedOnDevice,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { lastValueFrom } from "rxjs";

type DAError = GetAddressDAError | SignTransactionDAError;

const SW_OK = 0x9000;

const toDerivationPath = (path: string): string => path.replace(/^m\//, "");

/**
 * Adapts `@ledgerhq/device-signer-kit-casper` (hex-string outputs) to the
 * coin-module `CasperSigner` contract (Buffer-based, `@zondax/ledger-casper` shaped responses).
 */
export class DmkSignerCasper implements CasperSigner {
  private readonly signer: SignerCasper;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    this.signer = new SignerCasperBuilder({ dmk, sessionId }).build();
  }

  async showAddressAndPubKey(path: string): Promise<CasperGetAddrResponse> {
    try {
      return await this._getAddress(path, true);
    } catch (e) {
      throw e instanceof UserRefusedOnDevice ? new UserRefusedAddress() : e;
    }
  }

  getAddressAndPubKey(path: string): Promise<CasperGetAddrResponse> {
    return this._getAddress(path, false);
  }

  async sign(path: string, message: Buffer): Promise<CasperSignature> {
    const { observable } = this.signer.signTransaction(
      toDerivationPath(path),
      new Uint8Array(message),
      { skipOpenApp: true },
    );
    const { r, s, v } = this._mapResult(await lastValueFrom(observable));
    const signatureRS = Buffer.from(r + s, "hex");
    const signatureRSV = Buffer.concat([signatureRS, Buffer.from([v])]);
    return {
      returnCode: SW_OK,
      errorMessage: "",
      signatureRS,
      signatureRSV,
      signature_compact: signatureRSV,
    };
  }

  private async _getAddress(path: string, checkOnDevice: boolean): Promise<CasperGetAddrResponse> {
    const { observable } = this.signer.getAddress(toDerivationPath(path), {
      checkOnDevice,
      skipOpenApp: true,
    });
    const { publicKey, address } = this._mapResult(await lastValueFrom(observable));
    return {
      returnCode: SW_OK,
      errorMessage: "",
      publicKey: Buffer.from(publicKey, "hex"),
      Address: address,
    };
  }

  private _mapResult<T, E extends DAError>(state: DeviceActionState<T, E, unknown>): T {
    switch (state.status) {
      case DeviceActionStatus.Completed:
        return state.output;
      case DeviceActionStatus.Error:
        throw this._mapError(state.error);
      default:
        throw new Error("Unexpected device action status");
    }
  }

  private _mapError<E extends DAError>(error: E): Error {
    if (!("errorCode" in error)) {
      return new Error(error._tag);
    }
    switch (error.errorCode) {
      case "5515":
        return new LockedDeviceError();
      case "6986":
        return new UserRefusedOnDevice();
      default:
        return new Error(`${error._tag} (errorCode: ${error.errorCode})`);
    }
  }
}
