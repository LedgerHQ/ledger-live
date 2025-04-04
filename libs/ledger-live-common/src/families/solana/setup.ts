// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-solana/bridge/js";
import makeCliTools from "@ledgerhq/coin-solana/cli-transaction";
import solanaResolver from "@ledgerhq/coin-solana/hw-getAddress";
import { SolanaCoinConfig } from "@ledgerhq/coin-solana/lib/config";
import { signMessage } from "@ledgerhq/coin-solana/lib/hw-signMessage";
import { SolanaSigner } from "@ledgerhq/coin-solana/signer";
import { SolanaAccount, Transaction, TransactionStatus } from "@ledgerhq/coin-solana/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { TransportStatusError, UpdateYourApp } from "@ledgerhq/errors";
import Solana from "@ledgerhq/hw-app-solana";
import { loadPKI } from "@ledgerhq/hw-bolos";
import Transport from "@ledgerhq/hw-transport";
import calService from "@ledgerhq/ledger-cal-service";
import trustService from "@ledgerhq/ledger-trust-service";
import type { Bridge } from "@ledgerhq/types-live";
import semver from "semver";
import {
  CreateSigner,
  createMessageSigner,
  createResolver,
  executeWithSigner,
} from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import { getCryptoCurrencyById } from "../../currencies";
import { LatestFirmwareVersionRequired } from "../../errors";
import type { Resolver } from "../../hw/getAddress/types";
import { prepareMessageToSign } from "../../hw/signMessage";

const TRUSTED_NAME_MIN_VERSION = "1.7.1";
const MANAGER_APP_NAME = "Solana";

async function checkVersion(app: Solana) {
  const { version } = await app.getAppConfiguration();
  if (semver.lt(version, TRUSTED_NAME_MIN_VERSION)) {
    throw new UpdateYourApp(undefined, {
      managerAppName: MANAGER_APP_NAME,
    });
  }
}

function isPKIUnsupportedError(err: unknown): err is TransportStatusError {
  return err instanceof TransportStatusError && err.message.includes("0x6a81");
}

const createSigner: CreateSigner<SolanaSigner> = (transport: Transport) => {
  const app = new Solana(transport);
  return {
    getAddress: app.getAddress,
    signTransaction: async (path, tx, resolution) => {
      if (resolution) {
        if (!resolution.deviceModelId) {
          throw new Error("Resolution provided without a deviceModelId");
        }

        if (resolution.deviceModelId !== DeviceModelId.nanoS) {
          const { descriptor, signature } = await calService.getCertificate(
            resolution.deviceModelId,
          );

          try {
            await loadPKI(transport, "TRUSTED_NAME", descriptor, signature);
          } catch (err) {
            if (isPKIUnsupportedError(err)) {
              throw new LatestFirmwareVersionRequired("LatestFirmwareVersionRequired");
            }
          }

          if (resolution.tokenAddress) {
            await checkVersion(app);

            const challenge = await app.getChallenge();
            const { signedDescriptor } = await trustService.getOwnerAddress(
              resolution.tokenAddress,
              challenge,
            );

            if (signedDescriptor) {
              await app.provideTrustedName(signedDescriptor);
            }
          }
          if (resolution.createATA) {
            await checkVersion(app);

            const challenge = await app.getChallenge();
            const { signedDescriptor } = await trustService.computedTokenAddress(
              resolution.createATA.address,
              resolution.createATA.mintAddress,
              challenge,
            );

            if (signedDescriptor) {
              await app.provideTrustedName(signedDescriptor);
            }
          }
        }
      }

      return app.signTransaction(path, tx);
    },
    signMessage: (path: string, messageHex: string) => {
      return app.signOffchainMessage(path, Buffer.from(messageHex, "hex"));
    },
  };
};

const getCurrencyConfig = () => {
  return getCurrencyConfiguration<SolanaCoinConfig>(getCryptoCurrencyById("solana"));
};

const bridge: Bridge<Transaction, SolanaAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const messageSigner = {
  prepareMessageToSign,
  signMessage: createMessageSigner(createSigner, signMessage),
};

const resolver: Resolver = createResolver(createSigner, solanaResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, messageSigner, resolver };
