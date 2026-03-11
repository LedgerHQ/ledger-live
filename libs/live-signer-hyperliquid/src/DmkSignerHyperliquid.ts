import {
  SignerHyperliquidBuilder,
  SignActionsDAError,
  SignerHyperliquid,
} from "@ledgerhq/device-signer-kit-hyperliquid";
import { DeviceActionStatus, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { SignActionsActionItem } from "@ledgerhq/device-signer-kit-hyperliquid/api/app-binder/SignActionsDeviceActionTypes.js";

export type Action = SignActionsActionItem;
export type Signature = {
  r: string;
  s: string;
  v: number;
};
export type Signatures = Signature[];
export type DAError = SignActionsDAError;

/**
 * DMK-based Hyperliquid signer using DMK signer-kit
 */
export class DmkSignerHyperliquid {
  private dmkSigner: SignerHyperliquid;

  /**
   * @param dmk - instance of Device Management Kit
   * @param sessionId - active session ID of the connected device
   */
  constructor(dmk: DeviceManagementKit, sessionId: string) {
    this.dmkSigner = new SignerHyperliquidBuilder({
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
        case "6985":
          return new UserRefusedOnDevice();
        default:
          return new Error(error._tag);
      }
    } else {
      return new Error(error._tag);
    }
  }

  /**
   * signs a Hyperliquid transaction via DMK.
   * @param path - BIP32 derivation path
   */
  async signActions(
    path: string,
    certificate: Uint8Array,
    signedMetadata: Uint8Array,
    actions: Action[],
  ): Promise<Signatures> {
    console.log(
      "PERPS Signer signActions:",
      "\npath",
      path,
      "\ncertificate",
      Buffer.from(certificate).toString("hex"),
      "\nmetadata",
      Buffer.from(signedMetadata).toString("hex"),
      "\nactions",
      actions,
    );
    const { observable } = this.dmkSigner.signActions({
      derivationPath: path,
      certificate,
      signedMetadata,
      actions,
    });
    return new Promise<Signatures>((resolve, reject) => {
      observable.subscribe({
        next: state => {
          if (state.status === DeviceActionStatus.Error) {
            reject(this._mapError<SignActionsDAError>(state.error));
          }
          if (state.status === DeviceActionStatus.Completed) {
            const signatures = state.output;
            resolve(signatures);
          }
        },
        error: err => {
          reject(err);
        },
      });
    });
  }
}
