import { lastValueFrom, Observable } from "rxjs";
import {
  GetAddressDAError,
  SignerEth,
  SignerEthBuilder,
  SignPersonalMessageDAError,
  SignTransactionDAError,
  SignTypedDataDAError,
  SignTransactionDAStep,
  SignTypedDataDAStateStep,
  Signature,
} from "@ledgerhq/device-signer-kit-ethereum";
import {
  DeviceActionState,
  DeviceActionStatus,
  DeviceManagementKit,
  hexaStringToBuffer,
} from "@ledgerhq/device-management-kit";
import { EIP712Message } from "@ledgerhq/types-live";
import {
  EthAppPleaseEnableContractData,
  LockedDeviceError,
  UserRefusedOnDevice,
} from "@ledgerhq/errors";
import { EvmAddress, EvmSigner, EvmSignerEvent } from "@ledgerhq/coin-evm/types/signer";
import type { LoadConfig, ResolutionConfig } from "@ledgerhq/hw-app-eth/lib/services/types";

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
      originToken: "1e55ba3959f4543af24809d9066a2120bd2ac9246e626e26a1ff77eb109ca0e5",
    }).build();
  }

  private _mapError<E extends DAError>(error: E): Error {
    if (!("errorCode" in error)) {
      return new Error(error._tag);
    }

    switch (error.errorCode) {
      case "5515":
        return new LockedDeviceError();
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

  private _formatSignature(signature: Signature) {
    return {
      r: signature.r.slice(2),
      s: signature.s.slice(2),
      v: signature.v,
    };
  }

  signPersonalMessage(path: string, messageHex: string): Observable<EvmSignerEvent> {
    const buffer = hexaStringToBuffer(messageHex);

    if (!buffer) {
      throw new Error("Invalid message");
    }

    return new Observable(observer => {
      observer.next({ type: "signer.evm.signing" });
      this.signer.signMessage(path, buffer, { skipOpenApp: true }).observable.subscribe({
        next: result => {
          if (result.status === DeviceActionStatus.Error) {
            observer.error(this._mapError<SignPersonalMessageDAError>(result.error));
          } else if (result.status === DeviceActionStatus.Completed) {
            observer.next({
              type: "signer.evm.signed",
              value: this._formatSignature(result.output),
            });
          }
        },
        error: error => observer.error(error),
        complete: () => observer.complete(),
      });
    });
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
          skipOpenApp: true,
        }).observable,
      ),
    );

    return {
      publicKey: result.publicKey,
      address: result.address,
      chainCode: result.chainCode,
    };
  }
  signTransaction(
    path: string,
    rawTxHex: string,
    _resolution?: ResolutionConfig,
  ): Observable<EvmSignerEvent> {
    const buffer = hexaStringToBuffer(rawTxHex);

    if (!buffer) {
      throw new Error("Invalid transaction");
    }

    return new Observable(observer => {
      this.signer
        .signTransaction(path, buffer, {
          skipOpenApp: true,
        })
        .observable.subscribe({
          next: result => {
            if (result.status === DeviceActionStatus.Error) {
              observer.error(this._mapError<SignTransactionDAError>(result.error));
            }
            if (result.status === DeviceActionStatus.Pending) {
              if (result.intermediateValue.step === SignTransactionDAStep.SIGN_TRANSACTION) {
                observer.next({ type: "signer.evm.signing" });
              }
              if (result.intermediateValue.step === SignTransactionDAStep.BUILD_CONTEXTS) {
                observer.next({ type: "signer.evm.loading-context" });
              }
              if (result.intermediateValue.step === SignTransactionDAStep.WEB3_CHECKS_OPT_IN) {
                observer.next({ type: "signer.evm.transaction-checks-opt-in-triggered" });
              }
              if (
                result.intermediateValue.step === SignTransactionDAStep.WEB3_CHECKS_OPT_IN_RESULT &&
                result.intermediateValue.result === true
              ) {
                observer.next({ type: "signer.evm.transaction-checks-opt-in" });
              }
              if (
                result.intermediateValue.step === SignTransactionDAStep.WEB3_CHECKS_OPT_IN_RESULT &&
                result.intermediateValue.result === false
              ) {
                observer.next({ type: "signer.evm.transaction-checks-opt-out" });
              }
            } else if (result.status === DeviceActionStatus.Completed) {
              observer.next({
                type: "signer.evm.signed",
                value: this._formatSignature(result.output),
              });
            }
          },
          error: error => observer.error(error),
          complete: () => observer.complete(),
        });
    });
  }

  signEIP712Message(
    path: string,
    jsonMessage: EIP712Message,
    _fullImplem?: boolean,
  ): Observable<EvmSignerEvent> {
    return new Observable(observer => {
      this.signer.signTypedData(path, jsonMessage, { skipOpenApp: true }).observable.subscribe({
        next: result => {
          if (result.status === DeviceActionStatus.Error) {
            observer.error(this._mapError<SignTypedDataDAError>(result.error));
          }
          if (result.status === DeviceActionStatus.Pending) {
            if (
              result.intermediateValue.step === SignTypedDataDAStateStep.SIGN_TYPED_DATA ||
              result.intermediateValue.step === SignTypedDataDAStateStep.SIGN_TYPED_DATA_LEGACY
            ) {
              observer.next({ type: "signer.evm.signing" });
            }
            if (result.intermediateValue.step === SignTypedDataDAStateStep.BUILD_CONTEXT) {
              observer.next({ type: "signer.evm.loading-context" });
            }
          } else if (result.status === DeviceActionStatus.Completed) {
            observer.next({
              type: "signer.evm.signed",
              value: this._formatSignature(result.output),
            });
          }
        },
        error: error => observer.error(error),
        complete: () => observer.complete(),
      });
    });
  }

  setLoadConfig(_config: LoadConfig) {
    // not implemented
  }

  clearSignTransaction(
    path: string,
    rawTxHex: string,
    resolutionConfig: ResolutionConfig,
    _throwOnError: boolean,
  ) {
    return this.signTransaction(path, rawTxHex, resolutionConfig);
  }

  signEIP712HashedMessage(
    _path: string,
    _domainSeparatorHex: string,
    _hashStructMessageHex: string,
  ): Observable<EvmSignerEvent> {
    throw new Error("Method not implemented.");
  }
}
