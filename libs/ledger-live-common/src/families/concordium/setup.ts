import type { ConcordiumSigner } from "@ledgerhq/coin-concordium";
import { createBridges } from "@ledgerhq/coin-concordium/bridge/index";
import concordiumResolver from "@ledgerhq/coin-concordium/signer";
import type { ConcordiumBridgeConfig } from "@ledgerhq/coin-concordium/config";
import { ConcordiumAccount, Transaction, TransactionStatus } from "@ledgerhq/coin-concordium/types";
import { DmkSignerConcordium } from "@ledgerhq/live-signer-concordium";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { buildContext } from "../../bridge/generic-coin-framework/api/context";
import type { Resolver } from "../../hw/getAddress/types";
import { isDmkTransport } from "../../hw/dmkUtils";

const createSigner: CreateSigner<ConcordiumSigner> = (transport: Transport): ConcordiumSigner => {
  if (!isDmkTransport(transport)) {
    throw new Error("Concordium requires DMK transport");
  }
  return new DmkSignerConcordium(transport.dmk, transport.sessionId);
};

const bridge: Bridge<Transaction, ConcordiumAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  buildContext<ConcordiumBridgeConfig>("concordium"),
);

const resolver: Resolver = createResolver(createSigner, concordiumResolver);

export { bridge, resolver };
