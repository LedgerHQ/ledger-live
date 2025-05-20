import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  makeAccountBridgeReceive,
  makeScanAccounts,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { CoinConfig } from "@ledgerhq/coin-framework/config";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, Bridge, CurrencyBridge } from "@ledgerhq/types-live";
import polkadotCoinConfig, { type PolkadotCoinConfig } from "../config";
import signerGetAddress from "../signer";
import type {
  PolkadotAccount,
  PolkadotSigner,
  TransactionRaw,
  TransactionStatus,
  Transaction,
  PolkadotAccountRaw,
  PolkadotOperationExtra,
  PolkadotOperationExtraRaw,
} from "../types";
import { broadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getSerializedAddressParameters } from "./exchange";
import formatters from "./formatters";
import { getTransactionStatus } from "./getTransactionStatus";
import { getPreloadStrategy, hydrate, preload } from "./preload";
import { prepareTransaction } from "./prepareTransaction";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "./serialization";
import { buildSignOperation } from "./signOperation";
import { getAccountShape, sync } from "./synchronization";
import { serialization } from "./transaction";

function buildCurrencyBridge(signerContext: SignerContext<PolkadotSigner>): CurrencyBridge {
  const getAddress = signerGetAddress(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    getPreloadStrategy,
    preload,
    hydrate,
    scanAccounts,
  };
}

export type PolkadotAccountBridge = AccountBridge<
  Transaction,
  PolkadotAccount,
  TransactionStatus,
  PolkadotAccountRaw,
  PolkadotOperationExtra,
  PolkadotOperationExtraRaw
>;

function buildAccountBridge(signerContext: SignerContext<PolkadotSigner>): PolkadotAccountBridge {
  const getAddress = signerGetAddress(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction,
    getTransactionStatus,
    prepareTransaction,
    sync,
    receive,
    signOperation,
    broadcast,
    assignFromAccountRaw,
    assignToAccountRaw,
    fromOperationExtraRaw,
    toOperationExtraRaw,
    formatAccountSpecifics: formatters.formatAccountSpecifics,
    formatOperationSpecifics: formatters.formatOperationSpecifics,
    getSerializedAddressParameters,
  };
}

export type PolkadotBridge = Bridge<
  Transaction,
  TransactionRaw,
  PolkadotAccount,
  PolkadotAccountRaw,
  PolkadotOperationExtra,
  PolkadotOperationExtraRaw
>;

export function createBridges(
  signerContext: SignerContext<PolkadotSigner>,
  coinConfig: CoinConfig<PolkadotCoinConfig>,
): PolkadotBridge {
  polkadotCoinConfig.setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
    serializationBridge: serialization,
  };
}
