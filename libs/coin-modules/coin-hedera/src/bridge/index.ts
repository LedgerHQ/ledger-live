import {
  getSerializedAddressParameters,
  makeScanAccounts,
  makeSync,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { CoinConfig } from "@ledgerhq/coin-framework/config";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { broadcast } from "./broadcast";
import hederaCoinConfig, { HederaCoinConfig } from "../config";
import { createTransaction } from "./createTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import { receive } from "./receive";
import { buildSignOperation } from "./signOperation";
import { getAccountShape, buildIterateResult } from "./synchronisation";
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";
import resolver from "../signer/index";
import type { Transaction, TransactionStatus, HederaSigner, HederaAccount } from "../types";

function buildCurrencyBridge(signerContext: SignerContext<HederaSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    buildIterateResult,
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    preload: () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
  };
}

const sync = makeSync({ getAccountShape });

function buildAccountBridge(
  signerContext: SignerContext<HederaSigner>,
): AccountBridge<Transaction, HederaAccount, TransactionStatus> {
  const getAddress = resolver(signerContext);

  const signOperation = buildSignOperation(signerContext);

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction,
    getTransactionStatus,
    prepareTransaction,
    assignToAccountRaw,
    assignFromAccountRaw,
    sync,
    receive: receive(getAddressWrapper(getAddress)),
    signOperation,
    broadcast,
    getSerializedAddressParameters,
  };
}

export function createBridges(
  signerContext: SignerContext<HederaSigner>,
  coinConfig: CoinConfig<HederaCoinConfig>,
) {
  hederaCoinConfig.setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
