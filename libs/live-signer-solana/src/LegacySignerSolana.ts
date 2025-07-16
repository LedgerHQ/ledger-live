import semver from "semver";
import {
  AppConfig,
  Resolution,
  SolanaAddress,
  SolanaSignature,
  SolanaSigner,
} from "@ledgerhq/coin-solana/signer";
import Solana from "@ledgerhq/hw-app-solana";
import Transport, { TransportStatusError } from "@ledgerhq/hw-transport";
import { DeviceModelId } from "@ledgerhq/devices";
import calService from "@ledgerhq/ledger-cal-service";
import trustService from "@ledgerhq/ledger-trust-service";
import { loadPKI } from "@ledgerhq/hw-bolos";
import { LatestFirmwareVersionRequired, UpdateYourApp } from "@ledgerhq/errors";

const TRUSTED_NAME_MIN_VERSION = "1.7.1";
const MANAGER_APP_NAME = "Solana";

function isPKIUnsupportedError(err: unknown): err is TransportStatusError {
  return err instanceof TransportStatusError && err.message.includes("0x6a81");
}

export class LegacySignerSolana implements SolanaSigner {
  private signer: Solana;
  private transport: Transport;

  constructor(transport: Transport) {
    this.signer = new Solana(transport);
    this.transport = transport;
  }

  getAppConfiguration(): Promise<AppConfig> {
    return this.signer.getAppConfiguration();
  }

  private async checkAppVersion() {
    const { version } = await this.getAppConfiguration();
    if (semver.lt(version, TRUSTED_NAME_MIN_VERSION)) {
      throw new UpdateYourApp(undefined, {
        managerAppName: MANAGER_APP_NAME,
      });
    }
  }

  getAddress(path: string, display?: boolean | undefined): Promise<SolanaAddress> {
    return this.signer.getAddress(path, display);
  }

  async signTransaction(
    path: string,
    tx: Buffer,
    resolution?: Resolution | undefined,
  ): Promise<SolanaSignature> {
    if (resolution) {
      if (!resolution.deviceModelId) {
        throw new Error("Resolution provided without a deviceModelId");
      }

      if (resolution.deviceModelId !== DeviceModelId.nanoS) {
        const { descriptor, signature } = await calService.getCertificate(resolution.deviceModelId);

        try {
          await loadPKI(this.transport, "TRUSTED_NAME", descriptor, signature);
        } catch (err) {
          if (isPKIUnsupportedError(err)) {
            throw new LatestFirmwareVersionRequired("LatestFirmwareVersionRequired");
          }
        }

        if (resolution.tokenAddress) {
          await this.checkAppVersion();

          const challenge = await this.signer.getChallenge();
          const { signedDescriptor } = await trustService.getOwnerAddress(
            resolution.tokenAddress,
            challenge,
          );

          if (signedDescriptor) {
            await this.signer.provideTrustedName(signedDescriptor);
          }
        }
        if (resolution.createATA) {
          await this.checkAppVersion();

          const challenge = await this.signer.getChallenge();
          const { signedDescriptor } = await trustService.computedTokenAddress(
            resolution.createATA.address,
            resolution.createATA.mintAddress,
            challenge,
          );

          if (signedDescriptor) {
            await this.signer.provideTrustedName(signedDescriptor);
          }
        }
      }
    }

    return this.signer.signTransaction(path, tx);
  }

  signMessage(path: string, messageHex: string): Promise<SolanaSignature> {
    return this.signer.signOffchainMessage(path, Buffer.from(messageHex, "hex"));
  }
}
