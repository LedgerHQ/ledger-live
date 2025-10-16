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

/**
 * Required minimum version of App Solana for non NanoS devices.
 * For NanoS devices (being deprecated), all versions of App Solana
 * are outdated compared to what we want to enfore in the other cases.
 * As a result, Firebase `minVersion` can not be used here.
 * NOTE: The ability to specify a `minVersion` per device model from Firebase
 * is work in progress {@link https://ledgerhq.atlassian.net/browse/LIVE-17027}
 */
const MIN_VERSION = "1.9.2";
const MANAGER_APP_NAME = "Solana";

function isPKIUnsupportedError(err: unknown): err is TransportStatusError {
  return err instanceof TransportStatusError && err.message.includes("0x6a81");
}

async function tryLoadPKI(...args: Parameters<typeof loadPKI>) {
  try {
    await loadPKI(...args);
  } catch (err) {
    if (isPKIUnsupportedError(err)) {
      throw new LatestFirmwareVersionRequired("LatestFirmwareVersionRequired");
    }
  }
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

  private async checkAppVersion(
    minVersion: string,
    { throwOnOutdated }: { throwOnOutdated: boolean },
  ) {
    const { version } = await this.getAppConfiguration();
    const outdated = semver.lt(version, minVersion);

    if (outdated && throwOnOutdated) {
      throw new UpdateYourApp(undefined, {
        managerAppName: MANAGER_APP_NAME,
      });
    }
    return !outdated;
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
        await this.checkAppVersion(MIN_VERSION, { throwOnOutdated: true });

        const { descriptor, signature } = await calService.getCertificate(
          resolution.deviceModelId,
          "trusted_name",
          "latest",
          { signatureKind: resolution.certificateSignatureKind },
        );

        try {
          await loadPKI(this.transport, "TRUSTED_NAME", descriptor, signature);
        } catch (err) {
          if (isPKIUnsupportedError(err)) {
            throw new LatestFirmwareVersionRequired("LatestFirmwareVersionRequired");
          }
        }

        if (resolution.tokenAddress) {
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

        if (resolution.tokenInternalId) {
          const { descriptor: coinMetaDescriptor, signature: coinMetaSignature } =
            await calService.getCertificate(resolution.deviceModelId, "coin_meta", "latest", {
              signatureKind: resolution.certificateSignatureKind,
            });

          await tryLoadPKI(this.transport, "COIN_META", coinMetaDescriptor, coinMetaSignature);

          const token = await calService.findToken(
            { id: resolution.tokenInternalId },
            { signatureKind: resolution.certificateSignatureKind },
          );

          await this.signer.provideTrustedDynamicDescriptor({
            data: Buffer.from(token.descriptor.data, "hex"),
            signature: Buffer.from(token.descriptor.signature, "hex"),
          });
        }
      }
    }

    return this.signer.signTransaction(path, tx, resolution?.userInputType);
  }

  signMessage(path: string, messageHex: string): Promise<SolanaSignature> {
    return this.signer.signOffchainMessage(path, Buffer.from(messageHex, "hex"));
  }
}
