import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  makeAccountBridgeReceive,
  makeScanAccounts,
  getSerializedAddressParameters,
  makeSync,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import createTransaction from "../logic/createTransaction";
import { validateAddress } from "../logic/validateAddress";
import { hydrate, preloadWithValidators } from "../preload";
import resolver from "../signer";
import type { Transaction, TransactionStatus, AptosSigner, AptosAccount } from "../types";
import broadcast from "./broadcast";
import estimateMaxSpendable from "./estimateMaxSpendable";
import getTransactionStatus from "./getTransactionStatus";
import prepareTransaction from "./prepareTransaction";
import { assignToAccountRaw, assignFromAccountRaw } from "./serialization";
import buildSignOperation from "./signOperation";
import { getAccountShape } from "./synchronisation";

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
