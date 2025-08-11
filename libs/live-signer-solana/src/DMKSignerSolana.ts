import {
  AppConfig,
  PubKeyDisplayMode,
  SolanaAddress,
  SolanaSignature,
  SolanaSigner,
} from "@ledgerhq/coin-solana/signer";
import { SignerSolanaBuilder } from "@ledgerhq/device-signer-kit-solana";
import { DeviceActionStatus, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import bs58 from "bs58";

/**
 * DMK-based Solana signer using DMK signer-kit
 */
export class DMKSignerSolana implements SolanaSigner {
  private dmkSigner: ReturnType<typeof SignerSolanaBuilder.prototype.build>;
  private readonly DMKPubKeyDisplayMode = {
    long: "long",
    short: "short",
  };

  /**
   * @param dmk - instance of Device Management Kit
   * @param sessionId - active session ID of the connected device
   */
  constructor(dmk: DeviceManagementKit, sessionId: string) {
    this.dmkSigner = new SignerSolanaBuilder({ dmk, sessionId }).build();
    console.log("DMKSignerSolana initialized with session ID:", sessionId);
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
            reject(state.error);
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
    console.log("Fetching address for path via DMK");
    const { observable } = this.dmkSigner.getAddress(path, { checkOnDevice: !!display });
    return new Promise<SolanaAddress>((resolve, reject) => {
      observable.subscribe({
        next: state => {
          if (state.status === DeviceActionStatus.Error) {
            reject(state.error);
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
  async signTransaction(path: string, txBuffer: Uint8Array): Promise<SolanaSignature> {
    console.log("Signing transaction via DMK");
    const { observable } = this.dmkSigner.signTransaction(path, txBuffer);
    return new Promise<SolanaSignature>((resolve, reject) => {
      observable.subscribe({
        next: state => {
          if (state.status === DeviceActionStatus.Error) {
            reject(state.error);
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
    console.log("Signing message via DMK");
    const { observable } = this.dmkSigner.signMessage(path, messageHex);
    return new Promise<SolanaSignature>((resolve, reject) => {
      observable.subscribe({
        next: state => {
          if (state.status === DeviceActionStatus.Error) {
            reject(state.error);
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
}
