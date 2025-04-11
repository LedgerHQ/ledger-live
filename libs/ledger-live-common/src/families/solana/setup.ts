// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import semver from "semver";
import Solana from "@ledgerhq/hw-app-solana";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { SolanaSigner } from "@ledgerhq/coin-solana/signer";
import { createBridges } from "@ledgerhq/coin-solana/bridge/js";
import makeCliTools from "@ledgerhq/coin-solana/cli-transaction";
import solanaResolver from "@ledgerhq/coin-solana/hw-getAddress";
import { SolanaAccount, Transaction, TransactionStatus } from "@ledgerhq/coin-solana/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { loadPKI } from "@ledgerhq/hw-bolos";
import calService from "@ledgerhq/ledger-cal-service";
import trustService from "@ledgerhq/ledger-trust-service";
import { TransportStatusError, UpdateYourApp } from "@ledgerhq/errors";
import {
  CreateSigner,
  createMessageSigner,
  createResolver,
  executeWithSigner,
} from "../../bridge/setup";
import { LatestFirmwareVersionRequired } from "../../errors";
import type { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";
import { SolanaCoinConfig } from "@ledgerhq/coin-solana/lib/config";
import { getCryptoCurrencyById } from "../../currencies";
import { signMessage } from "@ledgerhq/coin-solana/hw-signMessage";
import { toOffChainMessage } from "./offchainMessage/format";

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
    signMessage: (path: string, message: string) => {
      return app
        .signOffchainMessage(path, toOffChainMessage(message))
        .then(response => ({ signature: Buffer.from(response.signature.toString("hex")) }));
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
  signMessage: createMessageSigner(createSigner, signMessage),
};

const resolver: Resolver = createResolver(createSigner, solanaResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, messageSigner, resolver };
