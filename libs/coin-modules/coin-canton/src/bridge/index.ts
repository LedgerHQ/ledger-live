import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { CoinConfig } from "@ledgerhq/coin-framework/config";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge } from "@ledgerhq/types-live";
import cantonCoinConfig, { type CantonCoinConfig } from "../config";
import resolver from "../signer";
import { CantonCurrencyBridge, CantonSigner } from "../types";
import type { Transaction } from "../types";
import { broadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import { buildSignOperation } from "./signOperation";
import { makeGetAccountShape } from "./sync";
import { updateTransaction } from "./updateTransaction";
import { buildOnboardAccount, buildAuthorizePreapproval } from "./onboard";

export function createBridges(
  signerContext: SignerContext<CantonSigner>,
  coinConfig: CoinConfig<CantonCoinConfig>,
) {
  cantonCoinConfig.setCoinConfig(coinConfig);

  const getAddress = resolver(signerContext);
  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));

  const scanAccounts = makeScanAccounts({
    getAccountShape: makeGetAccountShape(signerContext),
    getAddressFn: getAddress,
  });

  const onboardAccount = buildOnboardAccount(signerContext);
  const authorizePreapproval = buildAuthorizePreapproval(signerContext);

  const currencyBridge: CantonCurrencyBridge = {
    preload: () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
    onboardAccount,
    authorizePreapproval,
  };

  const signOperation = buildSignOperation(signerContext);
  const sync = makeSync({ getAccountShape: makeGetAccountShape(signerContext) });
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
    sync,
    receive,
    signOperation,
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    getSerializedAddressParameters,
  };

  return {
    currencyBridge,
    accountBridge,
  };
}
