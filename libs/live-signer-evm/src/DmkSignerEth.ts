import { lastValueFrom } from "rxjs";
import {
  GetAddressDAError,
  SignerEth,
  SignerEthBuilder,
  SignPersonalMessageDAError,
  SignTransactionDAError,
  SignTypedDataDAError,
} from "@ledgerhq/device-signer-kit-ethereum";
import {
  DeviceActionState,
  DeviceActionStatus,
  DeviceManagementKit,
  hexaStringToBuffer,
} from "@ledgerhq/device-management-kit";
import { EIP712Message } from "@ledgerhq/types-live";
import { EthAppPleaseEnableContractData, UserRefusedOnDevice } from "@ledgerhq/errors";
import { EvmAddress, EvmSignature, EvmSigner } from "@ledgerhq/coin-evm/types/signer";
import { LoadConfig, ResolutionConfig } from "@ledgerhq/hw-app-eth/lib/services/types";

export type DAError =
  | GetAddressDAError
  | SignTypedDataDAError
  | SignTransactionDAError
  | SignPersonalMessageDAError;

export class DmkSignerEth implements EvmSigner {
  private readonly signer: SignerEth;
  constructor(
    readonly dmk: DeviceManagementKit,
    readonly sessionId: string,
  ) {
    this.signer = new SignerEthBuilder({
      dmk,
      sessionId,
    }).build();
  }

  private _mapError<E extends DAError>(error: E): Error {
    if (!("errorCode" in error)) {
      return new Error(error._tag);
    }

    switch (error.errorCode) {
      case "6985":
        return new UserRefusedOnDevice();
      case "6a80":
        return new EthAppPleaseEnableContractData(
          "Please enable Blind signing or Contract data in the Ethereum app Settings",
        );
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

  async signPersonalMessage(path: string, messageHex: string): Promise<EvmSignature> {
    const buffer = hexaStringToBuffer(messageHex);

    if (!buffer) {
      throw new Error("Invalid message");
    }

    const result = this._mapResult(
      await lastValueFrom(this.signer.signMessage(path, buffer).observable),
    );

    return {
      r: result.r.slice(2),
      s: result.s.slice(2),
      v: result.v,
    };
  }

  async getAddress(
    path: string,
    boolDisplay?: boolean,
    boolChaincode?: boolean,
    _chainId?: string,
  ): Promise<EvmAddress> {
    const result = this._mapResult(
      await lastValueFrom(
        this.signer.getAddress(path, {
          checkOnDevice: boolDisplay,
          returnChainCode: boolChaincode,
        }).observable,
      ),
    );

    return {
      publicKey: result.publicKey,
      address: result.address,
      chainCode: result.chainCode,
    };
  }
  async signTransaction(path: string, rawTxHex: string, _resolution?: any): Promise<EvmSignature> {
    const buffer = hexaStringToBuffer(rawTxHex);

    if (!buffer) {
      throw new Error("Invalid transaction");
    }

    const result = this._mapResult(
      await lastValueFrom(this.signer.signTransaction(path, buffer).observable),
    );

    return {
      r: result.r.slice(2),
      s: result.s.slice(2),
      v: result.v,
    };
  }

  async signEIP712Message(
    path: string,
    jsonMessage: EIP712Message,
    _fullImplem?: boolean,
  ): Promise<EvmSignature> {
    const result = this._mapResult(
      await lastValueFrom(this.signer.signTypedData(path, jsonMessage).observable),
    );

    return {
      r: result.r.slice(2),
      s: result.s.slice(2),
      v: result.v,
    };
  }

  setLoadConfig(_config: LoadConfig) {
    console.log("not implemented");
  }

  clearSignTransaction(
    path: string,
    rawTxHex: string,
    _resolutionConfig: ResolutionConfig,
    _throwOnError: boolean,
  ): Promise<EvmSignature> {
    return this.signTransaction(path, rawTxHex);
  }

  signEIP712HashedMessage(
    _path: string,
    _domainSeparatorHex: string,
    _hashStructMessageHex: string,
  ): Promise<EvmSignature> {
    throw new Error("Method not implemented.");
  }
}
