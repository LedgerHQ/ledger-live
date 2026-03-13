import {
  CosmosAddress,
  CosmosGetAddressAndPubKeyRes,
  CosmosSignature,
  CosmosSigner,
} from "@ledgerhq/coin-cosmos/types/signer";
import {
  GetAddressDAError,
  SignerCosmosBuilder,
  SignTransactionDAError,
  type SignerCosmos,
} from "@ledgerhq/device-signer-kit-cosmos";
import { DeviceActionStatus, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";

type DAError = GetAddressDAError | SignTransactionDAError;

const DEFAULT_HRP = "cosmos";
const SW_OK = 0x9000;

export class DmkSignerCosmos implements CosmosSigner {
  private readonly signer: SignerCosmos;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    this.signer = new SignerCosmosBuilder({ dmk, sessionId }).build();
  }

  private _mapError<E extends DAError>(error: E): Error {
    if (
      typeof error.originalError !== "object" ||
      error.originalError === null ||
      !("errorCode" in error.originalError)
    ) {
      return new Error(error._tag);
    }

    switch (error.originalError.errorCode) {
      case "5515":
        return new LockedDeviceError();
      case "6986":
        return new UserRefusedOnDevice();
      default:
        return new Error(error._tag);
    }
  }

  public async getAddressAndPubKey(
    path: number[],
    hrp: string,
    boolDisplay?: boolean,
  ): Promise<CosmosGetAddressAndPubKeyRes> {
    const derivationPath = path.join("/");
    const { observable } = this.signer.getAddress(derivationPath, hrp, {
      checkOnDevice: !!boolDisplay,
      skipOpenApp: true,
    });
    return new Promise<CosmosGetAddressAndPubKeyRes>((resolve, reject) => {
      observable.subscribe({
        next: state => {
          if (state.status === DeviceActionStatus.Error) {
            reject(this._mapError<GetAddressDAError>(state.error));
          }
          if (state.status === DeviceActionStatus.Completed) {
            resolve({
              bech32_address: state.output.address,
              // Legacy consumer (signOperation.ts) expects raw Buffer at runtime, matching Zondax behavior
              compressed_pk: Buffer.from(state.output.publicKey) as any,
              return_code: SW_OK,
              error_message: "",
            });
          }
        },
        error: err => {
          reject(err);
        },
      });
    });
  }

  public async getAddress(
    path: string,
    hrp: string,
    boolDisplay?: boolean,
  ): Promise<CosmosAddress> {
    const parts = path.split("/");
    while (parts.length < 5) {
      parts.push("0");
    }
    const paddedPath = parts.join("/");
    const { observable } = this.signer.getAddress(paddedPath, hrp, {
      checkOnDevice: !!boolDisplay,
      skipOpenApp: true,
    });
    return new Promise<CosmosAddress>((resolve, reject) => {
      observable.subscribe({
        next: state => {
          if (state.status === DeviceActionStatus.Error) {
            reject(this._mapError<GetAddressDAError>(state.error));
          }
          if (state.status === DeviceActionStatus.Completed) {
            resolve({
              publicKey: Buffer.from(state.output.publicKey).toString("hex"),
              address: state.output.address,
            });
          }
        },
        error: err => {
          reject(err);
        },
      });
    });
  }

  public async sign(
    path: number[],
    buffer: Buffer,
    transactionType?: string,
  ): Promise<CosmosSignature> {
    const derivationPath = path.join("/");

    const { observable } = this.signer.signTransaction(
      derivationPath,
      transactionType ?? DEFAULT_HRP,
      buffer,
      {
        skipOpenApp: true,
      },
    );

    return new Promise<CosmosSignature>((resolve, reject) => {
      observable.subscribe({
        next: state => {
          if (state.status === DeviceActionStatus.Error) {
            reject(this._mapError<SignTransactionDAError>(state.error));
          }
          if (state.status === DeviceActionStatus.Completed) {
            resolve({
              signature: Buffer.from(state.output),
              return_code: SW_OK,
            });
          }
        },
        error: err => {
          reject(err);
        },
      });
    });
  }
}
