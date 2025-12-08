import {
  AppConfig,
  PubKeyDisplayMode,
  Resolution,
  SolanaAddress,
  SolanaSignature,
  SolanaSigner,
} from "@ledgerhq/coin-solana/signer";
import {
  SignerSolanaBuilder,
  GetAddressDAError,
  GetAppConfigurationDAError,
  SignMessageDAError,
  SignTransactionDAError,
  SignerSolana,
} from "@ledgerhq/device-signer-kit-solana";
import { DeviceActionStatus, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import bs58 from "bs58";
import { SolAppPleaseEnableContractData, UserRefusedOnDevice } from "@ledgerhq/errors";

export type DAError =
  | GetAddressDAError
  | GetAppConfigurationDAError
  | SignMessageDAError
  | SignTransactionDAError;

/**
 * DMK-based Solana signer using DMK signer-kit
 */
export class DmkSignerSol implements SolanaSigner {
  private dmkSigner: SignerSolana;
  private readonly DMKPubKeyDisplayMode: { readonly long: string; readonly short: string } = {
    long: "long",
    short: "short",
  };

  /**
   * @param dmk - instance of Device Management Kit
   * @param sessionId - active session ID of the connected device
   */
  constructor(dmk: DeviceManagementKit, sessionId: string) {
    this.dmkSigner = new SignerSolanaBuilder({
      dmk,
      sessionId,
      originToken: "Solana",
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
        case "6808":
          return new SolAppPleaseEnableContractData(
            "Please enable Blind signing in the Solana app Settings",
          );
        default:
          return new Error(error._tag);
      }
    } else {
      return new Error(error._tag);
    }
  }

  /**
   * fetches current app configuration from the device via DMK
   */
  async getAppConfiguration(): Promise<AppConfig> {
    const { observable } = this.dmkSigner.getAppConfiguration();
    return new Promise<AppConfig>((resolve, reject) => {
      observable.subscribe({
        next: state => {
          if (state.status === DeviceActionStatus.Error) {
            reject(this._mapError<GetAppConfigurationDAError>(state.error));
          }
          if (state.status === DeviceActionStatus.Completed) {
            const { version, blindSigningEnabled, pubKeyDisplayMode } = state.output;
            const mode =
              pubKeyDisplayMode === this.DMKPubKeyDisplayMode.long
                ? PubKeyDisplayMode.LONG
                : PubKeyDisplayMode.SHORT;
            resolve({ version, blindSigningEnabled, pubKeyDisplayMode: mode });
          }
        },
        error: err => {
          reject(err);
        },
      });
    });
  }

  /**
   * retrieves a Solana address for the given derivation path.
   * @param path - BIP32 derivation path
   * @param display - whether to prompt user confirmation on device
   */
  async getAddress(path: string, display?: boolean): Promise<SolanaAddress> {
    const { observable } = this.dmkSigner.getAddress(path, {
      checkOnDevice: !!display,
      skipOpenApp: true,
    });
    return new Promise<SolanaAddress>((resolve, reject) => {
      observable.subscribe({
        next: state => {
          if (state.status === DeviceActionStatus.Error) {
            reject(this._mapError<GetAddressDAError>(state.error));
          }
          if (state.status === DeviceActionStatus.Completed) {
            const addressString = state.output;
            const addressBytes = Buffer.from(bs58.decode(addressString));
            resolve({ address: addressBytes });
          }
        },
        error: err => {
          reject(err);
        },
      });
    });
  }

  /**
   * signs a Solana transaction via DMK.
   * @param path - BIP32 derivation path
   * @param txBuffer - transaction data as a uint8 array
   */
  async signTransaction(
    path: string,
    txBuffer: Uint8Array,
    resolution?: Resolution | undefined,
  ): Promise<SolanaSignature> {
    const { observable } = this.dmkSigner.signTransaction(path, txBuffer, {
      transactionResolutionContext: resolution,
      skipOpenApp: true,
    });
    return new Promise<SolanaSignature>((resolve, reject) => {
      observable.subscribe({
        next: state => {
          if (state.status === DeviceActionStatus.Error) {
            reject(this._mapError<SignTransactionDAError>(state.error));
          }
          if (state.status === DeviceActionStatus.Completed) {
            const signatureBuffer = Buffer.from(state.output);
            resolve({ signature: signatureBuffer });
          }
        },
        error: err => {
          reject(err);
        },
      });
    });
  }

  /**
   * signs an offchain message displayed on device via DMK.
   * @param path - BIP32 derivation path
   * @param messageHex - message to sign in hexadecimal format
   */
  async signMessage(path: string, messageHex: string): Promise<SolanaSignature> {
    const { observable } = this.dmkSigner.signMessage(path, messageHex, {
      skipOpenApp: true,
    });
    return new Promise<SolanaSignature>((resolve, reject) => {
      observable.subscribe({
        next: state => {
          if (state.status === DeviceActionStatus.Error) {
            reject(this._mapError<SignMessageDAError>(state.error));
          }
          if (state.status === DeviceActionStatus.Completed) {
            const signatureBuffer = Buffer.from(state.output.signature);
            resolve({ signature: signatureBuffer });
          }
        },
        error: err => {
          reject(err);
        },
      });
    });
  }
}
