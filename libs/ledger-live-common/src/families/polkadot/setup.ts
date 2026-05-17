// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import {
  PolkadotAccount,
  TransactionStatus,
  createBridges,
  type Transaction,
} from "@ledgerhq/coin-polkadot";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { PolkadotCoinConfig } from "@ledgerhq/coin-polkadot/config";
import { PolkadotSigner } from "@ledgerhq/coin-polkadot/types/signer";
import polkadotResolver from "@ledgerhq/coin-polkadot/signer/index";
import makeCliTools, { type CliTools } from "@ledgerhq/coin-polkadot/test/cli";
import { createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";
import { DmkSignerPolkadot, LegacySignerPolkadot } from "@ledgerhq/live-signer-polkadot";
import { isDmkTransport } from "../../hw/dmkUtils";

let _polkadotLdmkFFEnabled: boolean = false;

// temporary solution to dynamically enable/disable the Polkadot DMK signer,
// waiting for LIVE-20250 to be implemented
// to be removed together with useFeature("ldmkPolkadotSigner")
export function setPolkadotLdmkEnabled(enabled: boolean): void {
  _polkadotLdmkFFEnabled = enabled;
}

export function getPolkadotSignerInstance(transport: Transport): PolkadotSigner {
  if (isDmkTransport(transport) && _polkadotLdmkFFEnabled) {
    return new DmkSignerPolkadot(transport.dmk, transport.sessionId);
  }
  return new LegacySignerPolkadot(transport);
}

const getCurrencyConfig = (currencyId?: string): PolkadotCoinConfig => {
  if (!currencyId) {
    throw new Error("No currency provided");
  }
  return getCurrencyConfiguration<PolkadotCoinConfig>(currencyId);
};

const bridge: Bridge<Transaction, PolkadotAccount, TransactionStatus> = createBridges(
  executeWithSigner(getPolkadotSignerInstance),
  getCurrencyConfig,
);

const resolver: Resolver = createResolver(getPolkadotSignerInstance, polkadotResolver);

const cliTools: CliTools = makeCliTools();

export { bridge, cliTools, resolver };
