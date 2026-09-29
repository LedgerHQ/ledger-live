import {
  GetAddressDAError,
  SignerPolkadotBuilder,
  SignTransactionDAError,
  type SignerPolkadot,
} from "@ledgerhq/device-signer-kit-polkadot";
import { DeviceActionStatus, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  LockedDeviceError,
  UserRefusedAddress,
  UserRefusedOnDevice,
} from "@ledgerhq/hw-transport/errors";
import type {
  PolkadotAddress,
  PolkadotSignature,
  PolkadotSigner,
} from "@ledgerhq/coin-polkadot/types/signer";

const SW_OK = 0x9000;
// The DMK's GetAddressCommand requires exactly 5 derivation path elements, but scanAccounts
// legitimately probes the family's default/legacy derivation mode with a shorter path (e.g.
// 44'/354'/0'). The legacy hw-app-polkadot client tolerates this; the DMK signer kit doesn't,
// so pad it here - mirrors DmkSignerCosmos's identical fix for the same class of problem.
const DERIVATION_PATH_DEPTH = 5;

export class DmkSignerPolkadot implements PolkadotSigner {
  private readonly signer: SignerPolkadot;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    this.signer = new SignerPolkadotBuilder({ dmk, sessionId }).build();
  }

  // The legacy client throws `UserRefusedAddress` specifically on address-verification
  // refusal, and the mobile receive-verification flow special-cases that exact error name
  // to avoid logging a normal cancellation as critical. The DMK path must match it here so
  // that behaviour stays identical with the flag on.
  private _mapAddressError<E extends GetAddressDAError>(error: E): Error {
    if (!("errorCode" in error) || error.errorCode === undefined) {
      return new Error(error._tag);
    }

    switch (error.errorCode) {
      case "5515":
        return new LockedDeviceError();
      case "6986":
        return new UserRefusedAddress();
      default:
        return new Error(`${error._tag} (${error.errorCode}): ${error.message}`);
    }
  }

  private _mapSignError<E extends SignTransactionDAError>(error: E): Error {
    if (!("errorCode" in error) || error.errorCode === undefined) {
      return new Error(error._tag);
    }

    switch (error.errorCode) {
      case "5515":
        return new LockedDeviceError();
      case "6986":
        return new UserRefusedOnDevice();
      default:
        return new Error(`${error._tag} (${error.errorCode}): ${error.message}`);
    }
  }

  async getAddress(
    path: string,
    ss58prefix: number,
    showAddrInDevice?: boolean,
  ): Promise<PolkadotAddress> {
    const parts = path.split("/");
    while (parts.length < DERIVATION_PATH_DEPTH) {
      parts.push("0");
    }
    const paddedPath = parts.join("/");
    const { observable } = this.signer.getAddress(paddedPath, ss58prefix, {
      checkOnDevice: showAddrInDevice,
      skipOpenApp: true,
    });
    return new Promise<PolkadotAddress>((resolve, reject) => {
      observable.subscribe({
        next: state => {
          if (state.status === DeviceActionStatus.Error) {
            reject(this._mapAddressError<GetAddressDAError>(state.error));
          }
          if (state.status === DeviceActionStatus.Completed) {
            resolve({
              pubKey: Buffer.from(state.output.publicKey).toString("hex"),
              address: state.output.address,
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

  async sign(path: string, message: Uint8Array, metadata: string): Promise<PolkadotSignature> {
    const metadataBytes = Buffer.from(metadata.slice(2), "hex");
    const { observable } = this.signer.signTransaction(path, message, metadataBytes, {
      skipOpenApp: true,
    });
    return new Promise<PolkadotSignature>((resolve, reject) => {
      observable.subscribe({
        next: state => {
          if (state.status === DeviceActionStatus.Error) {
            reject(this._mapSignError<SignTransactionDAError>(state.error));
          }
          if (state.status === DeviceActionStatus.Completed) {
            resolve({
              // The DMK returns the discriminant-inclusive 65-byte signature as raw bytes;
              // signExtrinsic only supports the hex-string branch of PolkadotSignature.
              signature: Buffer.from(state.output).toString("hex"),
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
