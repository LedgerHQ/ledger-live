import {
  makeAccountBridgeReceive,
  defaultUpdateTransaction,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { CoinConfig } from "@ledgerhq/coin-framework/config";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { getTransactionStatus } from "../getTransactionStatus";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { prepareTransaction } from "../prepareTransaction";
import { createTransaction } from "../createTransaction";
import { getAccountShape } from "../synchronization";
import { buildSignOperation } from "../signOperation";
import { XrpConfig, setCoinConfig } from "../config";
import type { Transaction } from "../types";
import { broadcast } from "../broadcast";
import resolver from "../hw-getAddress";
import { XrpSigner } from "../signer";

export function createBridges(
  signerContext: SignerContext<XrpSigner>,
  coinConfig: CoinConfig<XrpConfig>,
) {
  setCoinConfig(coinConfig);

  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({ getAccountShape, getAddressFn: getAddress });
  const currencyBridge: CurrencyBridge = {
    preload: () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
  };

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);
  const sync = makeSync({ getAccountShape });
  const accountBridge: AccountBridge<Transaction> = {
    createTransaction,
    updateTransaction: defaultUpdateTransaction<Transaction>,
    prepareTransaction,
    getTransactionStatus,
    estimateMaxSpendable,
    sync,
    receive,
    signOperation,
    broadcast,
  };

  return {
    currencyBridge,
    accountBridge,
  };
}
