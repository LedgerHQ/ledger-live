import {
  makeAccountBridgeReceive,
  makeScanAccounts,
  getSerializedAddressParameters,
  makeSync,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import resolver from "../signer";
import { assignToAccountRaw, assignFromAccountRaw } from "./serialization";
import type { Transaction, TransactionStatus, AptosSigner, AptosAccount } from "../types";
import getTransactionStatus from "./getTransactionStatus";
import estimateMaxSpendable from "./estimateMaxSpendable";
import prepareTransaction from "./prepareTransaction";
import { getAccountShape } from "./synchronisation";
import buildSignOperation from "./signOperation";
import broadcast from "./broadcast";
import createTransaction from "../logic/createTransaction";
import { hydrate, preloadWithValidators } from "../preload";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { validateAddress } from "../logic/validateAddress";

function makePreload() {
  return (currency: CryptoCurrency) => preloadWithValidators(currency);
}

function buildCurrencyBridge(signerContext: SignerContext<AptosSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    preload: makePreload(),
    hydrate,
    scanAccounts,
  };
}

const sync = makeSync({ getAccountShape });

function buildAccountBridge(
  signerContext: SignerContext<AptosSigner>,
): AccountBridge<Transaction, AptosAccount, TransactionStatus> {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction,
    getTransactionStatus,
    getSerializedAddressParameters,
    prepareTransaction,
    sync,
    receive,
    signOperation,
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    broadcast,
    assignToAccountRaw,
    assignFromAccountRaw,
    validateAddress,
  };
}

export function createBridges(signerContext: SignerContext<AptosSigner>) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
