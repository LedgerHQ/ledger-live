import { CoinConfig } from "@ledgerhq/coin-module-framework/config";
import getAddressWrapper from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  updateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import tronCoinConfig, { type TronCoinConfig } from "../config";
import { TRON_DUMMY_ADDRESS } from "../constants";
import { validateAddress } from "../logic";
import signerGetAddress from "../signer";
import { type Transaction, TronAccount, TronSigner } from "../types";
import broadcast from "./broadcast";
import createTransaction from "./createTransaction";
import estimateMaxSpendable from "./estimateMaxSpendable";
import getTransactionStatus from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "./serialization";
import { buildSignOperation } from "./signOperation";
import { getAccountShape, postSync, sync } from "./synchronization";

function buildCurrencyBridge(signerContext: SignerContext<TronSigner>): CurrencyBridge {
  const getAddress = signerGetAddress(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddressWrapper(getAddress),
    postSync,
  });

  return {
    preload: () => Promise.resolve({}),
    hydrate: () => undefined,
    scanAccounts,
  };
}

function buildAccountBridge(
  signerContext: SignerContext<TronSigner>,
): AccountBridge<Transaction, TronAccount> {
  const getAddress = signerGetAddress(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    estimateMaxSpendable,
    getEstimationRecipient: () => TRON_DUMMY_ADDRESS,
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
  signerContext: SignerContext<TronSigner>,
  coinConfig: CoinConfig<TronCoinConfig>,
) {
  tronCoinConfig.setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
