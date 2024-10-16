import {
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/lib/bridge/jsHelpers";
import resolver from "../hw-getAddress";
import getAddressWrapper from "@ledgerhq/coin-framework/lib/bridge/getAddressWrapper";
import { HederaSigner } from "../signer";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Account, AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { Transaction, TransactionStatus } from "../types";
import { getTransactionStatus } from "../getTransactionStatus";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { prepareTransaction } from "../prepareTransaction";
import { createTransaction } from "../createTransaction";
import { getAccountShape, buildIterateResult } from "../synchronisation";
import { buildSignOperation } from "../signOperation";
import { broadcast } from "../broadcast";
import { CoinConfig } from "@ledgerhq/coin-framework/lib/config";
import hederaCoinConfig, { type HederaCoinConfig } from "../config";


// export const preload = async () => {
//   const config = hederaCoinConfig.getCoinConfig();

//   return Promise.resolve({
//     config,
//   });
// };


function buildCurrencyBridge(signerContext: SignerContext<HederaSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    buildIterateResult,
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    preload: () => Promise.resolve({}),
    // preload: preload,
    hydrate: () => {},
    scanAccounts,
  };
}

const sync = makeSync({ getAccountShape });

function buildAccountBridge(
  signerContext: SignerContext<HederaSigner>,
): AccountBridge<Transaction, Account, TransactionStatus> {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction: defaultUpdateTransaction,
    getTransactionStatus,
    prepareTransaction,
    sync,
    receive,
    signOperation,
    broadcast,
  };
}

// const currencyBridge: CurrencyBridge = {
//   preload: () => Promise.resolve({}),
//   hydrate: () => {},
//   scanAccounts,
// };

// const accountBridge: AccountBridge<Transaction, Account, TransactionStatus> = {
//   estimateMaxSpendable,
//   createTransaction,
//   updateTransaction: defaultUpdateTransaction,
//   getTransactionStatus,
//   prepareTransaction,
//   sync,
//   receive,
//   signOperation,
//   broadcast,
// };

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

// export default {
//   currencyBridge,
//   accountBridge,
// };
