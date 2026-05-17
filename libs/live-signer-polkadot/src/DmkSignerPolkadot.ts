import {
  PolkadotAddress,
  PolkadotSignature,
  PolkadotSigner,
} from "@ledgerhq/coin-polkadot/types/signer";
import {
  SignerPolkadotBuilder,
  SignerPolkadot,
  GetAddressDAError,
  SignTransactionDAError,
} from "@ledgerhq/device-signer-kit-polkadot";
import { DeviceActionStatus, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";

export type DAError = GetAddressDAError | SignTransactionDAError;

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * DMK-based Polkadot signer using DMK signer-kit
 */
export class DmkSignerPolkadot implements PolkadotSigner {
  private dmkSigner: SignerPolkadot;

  /**
   * @param dmk - instance of Device Management Kit
   * @param sessionId - active session ID of the connected device
   */
  constructor(dmk: DeviceManagementKit, sessionId: string) {
    this.dmkSigner = new SignerPolkadotBuilder({
      dmk,
      sessionId,
    }).build();
  }

  private _mapError<E extends DAError>(error: E): Error {
    if (
      typeof error.originalError !== "object" ||
      error.originalError === null ||
      !("errorCode" in error.originalError)
    ) {
      return new Error(error._tag);
    }
    if (
      typeof error.originalError === "object" &&
      error.originalError !== null &&
      "errorCode" in error.originalError &&
      typeof error.originalError.errorCode === "string"
    ) {
      switch (error.originalError.errorCode) {
        case "5515":
          return new LockedDeviceError();
        case "6985":
          return new UserRefusedOnDevice();
        case "6986":
          return new UserRefusedOnDevice();
        default:
          return new Error(error._tag);
      }
    } else {
      return new Error(error._tag);
    }
  }

  /**
   * retrieves a Polkadot address for the given derivation path and SS58 prefix.
   * @param path - BIP32 derivation path
   * @param ss58prefix - SS58 address format prefix
   * @param showAddrInDevice - whether to prompt user confirmation on device
   */
  async getAddress(
    path: string,
    ss58prefix: number,
    showAddrInDevice?: boolean,
  ): Promise<PolkadotAddress> {
    const { observable } = this.dmkSigner.getAddress(path, ss58prefix, {
      checkOnDevice: !!showAddrInDevice,
      skipOpenApp: true,
    });
    return new Promise<PolkadotAddress>((resolve, reject) => {
      observable.subscribe({
        next: state => {
          if (state.status === DeviceActionStatus.Error) {
            reject(this._mapError<GetAddressDAError>(state.error));
          }
          if (state.status === DeviceActionStatus.Completed) {
            const { publicKey, address } = state.output;
            resolve({
              pubKey: uint8ArrayToHex(publicKey),
              address,
              return_code: 0x9000,
            });
          }
        },
        error: err => {
          reject(err);
        },
      });
    });
  }

  /**
   * signs a Polkadot transaction via DMK.
   * @param path - BIP32 derivation path
   * @param message - transaction payload as a Uint8Array
   * @param metadata - metadata hex string with 0x prefix
   */
  async sign(
    path: string,
    message: Uint8Array,
    metadata: string,
  ): Promise<PolkadotSignature> {
    const metadataBytes = hexToUint8Array(metadata.slice(2));
    const { observable } = this.dmkSigner.signTransaction(path, message, metadataBytes, {
      skipOpenApp: true,
    });
    return new Promise<PolkadotSignature>((resolve, reject) => {
      observable.subscribe({
        next: state => {
          if (state.status === DeviceActionStatus.Error) {
            reject(this._mapError<SignTransactionDAError>(state.error));
          }
          if (state.status === DeviceActionStatus.Completed) {
            const signatureBytes = state.output;
            resolve({
              signature: uint8ArrayToHex(signatureBytes),
              return_code: 0x9000,
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
