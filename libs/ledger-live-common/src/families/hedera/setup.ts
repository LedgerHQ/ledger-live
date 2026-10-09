// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import invariant from "invariant";
import { createBridges } from "@ledgerhq/coin-hedera/bridge/index";
import hederaResolver from "@ledgerhq/coin-hedera/signer/index";
import type {
  HederaCoinConfig,
  HederaSigner,
  TransactionStatus,
  Transaction,
  HederaAccount,
} from "@ledgerhq/coin-hedera/types/index";
import Transport from "@ledgerhq/hw-transport";
import { DmkSignerHedera, LegacySignerHedera } from "@ledgerhq/live-signer-hedera";
import type { Bridge } from "@ledgerhq/types-live";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import { isDmkTransport } from "../../hw/dmkUtils";
import { Resolver } from "../../hw/getAddress/types";
import { withGenericTransactionSupport } from "./legacyBridgeAdapter";

let _hederaLdmkFFEnabled: boolean = false;

export const setHederaLdmkEnabled = (enabled: boolean): void => {
  _hederaLdmkFFEnabled = enabled;
};

export const createSigner: CreateSigner<HederaSigner> = (transport: Transport) => {
  if (isDmkTransport(transport) && _hederaLdmkFFEnabled) {
    return new DmkSignerHedera(transport.dmk, transport.sessionId);
  }
  return new LegacySignerHedera(transport);
};

const getCurrencyConfig = (currencyId?: string) => {
  invariant(currencyId, "hedera: currencyId is required in getCurrencyConfig");
  return getCurrencyConfiguration<HederaCoinConfig>(currencyId);
};

const legacyBridge: Bridge<Transaction, HederaAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const bridge: Bridge<Transaction, HederaAccount, TransactionStatus> = {
  ...legacyBridge,
  accountBridge: withGenericTransactionSupport(legacyBridge.accountBridge),
};

const resolver: Resolver = createResolver(createSigner, hederaResolver);

export { bridge, resolver };
