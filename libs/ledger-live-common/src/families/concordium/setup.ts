import type { ConcordiumSigner } from "@ledgerhq/coin-concordium";
import { createBridges } from "@ledgerhq/coin-concordium/bridge/index";
import concordiumResolver from "@ledgerhq/coin-concordium/signer";
import type { ConcordiumCoinConfig } from "@ledgerhq/coin-concordium/config";
import { ConcordiumAccount, Transaction, TransactionStatus } from "@ledgerhq/coin-concordium/types";
import makeCliTools from "@ledgerhq/coin-concordium/test/cli";
import { DmkSignerConcordium } from "@ledgerhq/live-signer-concordium";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import type { Resolver } from "../../hw/getAddress/types";
import { isDmkTransport } from "../../hw/dmkUtils";

const createSigner: CreateSigner<ConcordiumSigner> = (transport: Transport): ConcordiumSigner => {
  if (!isDmkTransport(transport)) {
    throw new Error("Concordium requires DMK transport");
  }
  // live-signer-concordium pulls in @ledgerhq/device-management-kit ^1.3.0
  // (peer of the released signer-kit-concordium 0.3.0), while live-common
  // resolves DMK from the catalog (1.2.0). Both versions expose the same
  // runtime API surface used here, but TS treats them as nominally distinct.
  const dmk = transport.dmk as unknown as ConstructorParameters<typeof DmkSignerConcordium>[0];
  return new DmkSignerConcordium(dmk, transport.sessionId);
};

const getCurrencyConfig = (currencyId?: string) => {
  if (!currencyId) {
    throw new Error("currency not defined");
  }
  return getCurrencyConfiguration<ConcordiumCoinConfig>(currencyId);
};

const bridge: Bridge<Transaction, ConcordiumAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const resolver: Resolver = createResolver(createSigner, concordiumResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
