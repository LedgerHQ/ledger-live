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
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";

const TRUSTED_NAME_MIN_VERSION = "1.6.1";

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

          await loadPKI(transport, "TRUSTED_NAME", descriptor, signature);

          // TODO throw error to update the app and os if wrong version of the app instead of allowing non clear signing flows
          const { version } = await app.getAppConfiguration();
          if (resolution.tokenAddress && semver.gte(version, TRUSTED_NAME_MIN_VERSION)) {
            const challenge = await app.getChallenge();
            const { signedDescriptor } = await trustService.getOwnerAddress(
              resolution.tokenAddress,
              challenge,
            );

            if (signedDescriptor) {
              await app.provideTrustedName(signedDescriptor);
            }
          }
          if (resolution.createATA && semver.gte(version, TRUSTED_NAME_MIN_VERSION)) {
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
  };
};

const bridge: Bridge<Transaction, SolanaAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
);

const resolver: Resolver = createResolver(createSigner, solanaResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
