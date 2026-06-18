import { CoinConfig } from "@ledgerhq/coin-module-framework/config";
import getAddressWrapper from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import boilerplateCoinConfig, { type BoilerplateCoinConfig } from "../config";
import { validateAddress } from "../logic/validateAddress";
import resolver from "../signer";
import { BoilerplateSigner } from "../types";
import type { Transaction } from "../types";
import { DUMMY_RECIPIENT } from "../constants";
import { broadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import { buildSignOperation } from "./signOperation";
import { getAccountShape } from "./sync";
import { updateTransaction } from "./updateTransaction";

export function createBridges(
  signerContext: SignerContext<BoilerplateSigner>,
  coinConfig: CoinConfig<BoilerplateCoinConfig>,
) {
  boilerplateCoinConfig.setCoinConfig(coinConfig);

  const getAddress = resolver(signerContext);
  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));

  const scanAccounts = makeScanAccounts({ getAccountShape, getAddressFn: getAddress });
  const currencyBridge: CurrencyBridge = {
    preload: () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
  };

  const signOperation = buildSignOperation(signerContext);
  const sync = makeSync({ getAccountShape });
  // we want one method per file
  const accountBridge: AccountBridge<Transaction> = {
    broadcast,
    createTransaction,
    updateTransaction,
    // NOTE: use updateTransaction: defaultUpdateTransaction<Transaction>,
    // if you don't need to update the transaction patch object
    prepareTransaction,
    getTransactionStatus,
    estimateMaxSpendable,
    getEstimationRecipient: () => DUMMY_RECIPIENT,
    sync,
    receive,
    signOperation,
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    getSerializedAddressParameters,
    validateAddress,
  };

  return {
    currencyBridge,
    accountBridge,
  };
}
