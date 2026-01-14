import type { ConcordiumSigner } from "@ledgerhq/coin-concordium";
import { createBridges } from "@ledgerhq/coin-concordium/bridge/index";
import { CONCORDIUM_USE_SOFTWARE_SIGNER } from "@ledgerhq/coin-concordium/config";
import concordiumResolver from "@ledgerhq/coin-concordium/signer";
import {
  createMockSigner,
  generateMockKeyPair,
} from "@ledgerhq/coin-concordium/test/concordiumTestUtils";
import type { ConcordiumCoinConfig } from "@ledgerhq/coin-concordium/types";
import { ConcordiumAccount, Transaction, TransactionStatus } from "@ledgerhq/coin-concordium/types";
import Concordium from "@ledgerhq/hw-app-concordium";
import Transport from "@ledgerhq/hw-transport";
import { getEnv } from "@ledgerhq/live-env";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Bridge } from "@ledgerhq/types-live";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import type { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<ConcordiumSigner> = (transport: Transport) => {
  if (CONCORDIUM_USE_SOFTWARE_SIGNER) {
    const keyPair = generateMockKeyPair();
    return createMockSigner(keyPair);
  }

  const hwApp = new Concordium(transport);

  return {
    ...hwApp,
    signCredentialDeployment: async (
      payload: any,
      path: string,
      metadata?: { isNew?: boolean; address?: string },
    ): Promise<{ signature: string[] }> => {
      const signature = await hwApp.signCredentialDeployment(payload, path, metadata);
      return { signature: [signature] };
    },
  } as ConcordiumSigner;
};

const getCurrencyConfig = (currency?: CryptoCurrency) => {
  if (!currency) {
    throw new Error("currency not defined");
  }
  return getCurrencyConfiguration<ConcordiumCoinConfig>(currency);
};

const bridge: Bridge<Transaction, ConcordiumAccount, TransactionStatus> = getEnv("MOCK")
  ? // TODO: Add mock bridge when available
    createBridges(executeWithSigner(createSigner), getCurrencyConfig)
  : createBridges(executeWithSigner(createSigner), getCurrencyConfig);

const resolver: Resolver = createResolver(createSigner, concordiumResolver);

// TODO: Add CLI tools when available
const cliTools = undefined;

export { bridge, cliTools, resolver };
