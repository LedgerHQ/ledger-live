import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  updateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { CoinConfig } from "@ledgerhq/coin-framework/config";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import suiConfig, { type SuiCoinConfig } from "../config";
import { getAddress as signerGetAddress } from "../signer";
import { SuiAccount, SuiSigner, TransactionStatus, type Transaction } from "../types";
import { broadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { fromOperationExtraRaw, toOperationExtraRaw } from "./formatters";
import { getTransactionStatus } from "./getTransactionStatus";
import { getPreloadStrategy, hydrate, preload } from "./preload";
import { prepareTransaction } from "./prepareTransaction";
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";
import { buildSignOperation } from "./signOperation";
import { getAccountShape, sync } from "./synchronisation";
import { validateAddress } from "./validateAddress";

function buildCurrencyBridge(signerContext: SignerContext<SuiSigner>): CurrencyBridge {
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

function buildAccountBridge(
  signerContext: SignerContext<SuiSigner>,
): AccountBridge<Transaction, SuiAccount, TransactionStatus> {
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
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    broadcast,
    assignFromAccountRaw,
    assignToAccountRaw,
    fromOperationExtraRaw,
    toOperationExtraRaw,
    getSerializedAddressParameters,
    validateAddress,
  };
}

export function createBridges(
  signerContext: SignerContext<SuiSigner>,
  coinConfig: CoinConfig<SuiCoinConfig>,
) {
  suiConfig.setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
