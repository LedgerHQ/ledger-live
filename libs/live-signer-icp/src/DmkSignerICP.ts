import {
  DeviceActionStatus,
  type DeviceActionState,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import {
  type GetAddressDAError,
  type GetVersionDAError,
  type SignerIcp,
  SignerIcpBuilder,
  type SignTransactionDAError,
  type SignUpdateCallDAError,
} from "@ledgerhq/device-signer-kit-icp";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type {
  ICPAppConfiguration,
  ICPGetAddrResponse,
  ICPSignature,
  ICPSigner,
  ICPUpdateCallSignature,
} from "@ledgerhq/coin-internet_computer/types/signer";
import { lastValueFrom } from "rxjs";

type DAError =
  | GetAddressDAError
  | GetVersionDAError
  | SignTransactionDAError
  | SignUpdateCallDAError;

const SW_OK = 0x9000;

/**
 * Adapts `@ledgerhq/device-signer-kit-icp` (hex-string outputs) to the
 * coin-module `ICPSigner` contract (Buffer-based responses).
 */
export class DmkSignerICP implements ICPSigner {
  private readonly signer: SignerIcp;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    this.signer = new SignerIcpBuilder({ dmk, sessionId }).build();
  }

  async getAppConfiguration(): Promise<ICPAppConfiguration> {
    const { observable } = this.signer.getAppConfiguration();
    const { version, testMode, locked } = this._mapResult(await lastValueFrom(observable));
    return { version, testMode, locked };
  }

  showAddressAndPubKey(path: string): Promise<ICPGetAddrResponse> {
    return this._getAddress(path, true);
  }

  getAddressAndPubKey(path: string): Promise<ICPGetAddrResponse> {
    return this._getAddress(path, false);
  }

  async sign(path: string, message: Buffer, stake?: boolean): Promise<ICPSignature> {
    const { observable } = this.signer.signTransaction(path, new Uint8Array(message), {
      skipOpenApp: true,
      stake,
    });
    const { r, s, der } = this._mapResult(await lastValueFrom(observable));
    return {
      returnCode: SW_OK,
      // ICP consumes the raw 64-byte r‖s signature as the request `sender_sig`.
      signatureRS: Buffer.concat([Buffer.from(r, "hex"), Buffer.from(s, "hex")]),
      signatureDER: Buffer.from(der, "hex"),
    };
  }

  async signUpdateCall(
    path: string,
    callRequest: Buffer,
    readStateRequest: Buffer,
  ): Promise<ICPUpdateCallSignature> {
    const { observable } = this.signer.signUpdateCall(
      path,
      new Uint8Array(callRequest),
      new Uint8Array(readStateRequest),
      { skipOpenApp: true },
    );
    const { requestHash, requestSignature, readStateHash, readStateSignature, readStateBody } =
      this._mapResult(await lastValueFrom(observable));
    return {
      returnCode: SW_OK,
      requestHash: Buffer.from(requestHash, "hex"),
      // Each envelope's `sender_sig` is the raw 64-byte r‖s signature.
      requestSignatureRS: Buffer.concat([
        Buffer.from(requestSignature.r, "hex"),
        Buffer.from(requestSignature.s, "hex"),
      ]),
      readStateHash: Buffer.from(readStateHash, "hex"),
      readStateSignatureRS: Buffer.concat([
        Buffer.from(readStateSignature.r, "hex"),
        Buffer.from(readStateSignature.s, "hex"),
      ]),
      readStateBody: Buffer.from(readStateBody),
    };
  }

  private async _getAddress(path: string, checkOnDevice: boolean): Promise<ICPGetAddrResponse> {
    const { observable } = this.signer.getAddress(path, { checkOnDevice, skipOpenApp: true });
    const { publicKey, accountId, principal } = this._mapResult(await lastValueFrom(observable));
    return {
      returnCode: SW_OK,
      errorMessage: "",
      publicKey: Buffer.from(publicKey, "hex"),
      // accountId is the ICP account identifier, surfaced as the contract's `address` field.
      address: Buffer.from(accountId, "hex"),
      principalText: principal,
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
      // The ICP device app reports an on-device rejection as COMMAND_NOT_ALLOWED (0x6986).
      case "6986":
        return new UserRefusedOnDevice();
      default:
        return new Error(`${error._tag} (errorCode: ${error.errorCode})`);
    }
  }
}
