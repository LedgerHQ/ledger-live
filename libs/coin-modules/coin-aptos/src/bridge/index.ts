import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { CoinConfig } from "@ledgerhq/coin-framework/config";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { AccountBridge, Bridge, CurrencyBridge } from "@ledgerhq/types-live";
import getAddressWrapper from "@ledgerhq/coin-framework/lib/bridge/getAddressWrapper";
import { AptosSigner, Transaction } from "../types";
import aptosCoinConfig, { type AptosCoinConfig } from "../config";
import signerGetAddress from "../signer";
import { hydrate, preload, scanAccounts as makeScanAccounts } from "../logic";
import { sync } from "../logic";
import { broadcast } from "./account";
import { prepareTransaction } from "../logic/prepareTransaction";
export type { AptosCoinConfig } from "../config";

function buildCurrencyBridge(signerContext: SignerContext<AptosSigner>): CurrencyBridge {
  const scanAccounts = makeScanAccounts(signerContext);

  return {
    preload,
    hydrate,
    scanAccounts,
  };
}

function buildAccountBridge(signerContext: SignerContext<AptosSigner>): AccountBridge<Transaction> {
  const getAddress = signerGetAddress(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    sync,
    receive,
    // estimateMaxSpendable,
    // createTransaction,
    // updateTransaction,
    // getTransactionStatus,
    prepareTransaction,
    signOperation,
    broadcast,
    // assignFromAccountRaw,
    // assignToAccountRaw,
    // fromOperationExtraRaw,
    // toOperationExtraRaw,
    getSerializedAddressParameters,
  };
}

export function createBridges(
  signerContext: SignerContext<AptosSigner>,
  coinConfig: CoinConfig<AptosCoinConfig>,
): Bridge<Transaction> {
  aptosCoinConfig.setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
