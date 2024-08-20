import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import resolver from "../signer";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type {
  Transaction,
  TransactionStatus,
  ICPSigner,
  ICPAccount,
  ICPAccountRaw,
  InternetComputerOperation,
} from "../types";
import { getTransactionStatus } from "./getTransactionStatus";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { prepareTransaction } from "./prepareTransaction";
import { createTransaction } from "./createTransaction";
import { getAccountShape } from "./bridgeHelpers/account";
import { buildSignOperation } from "./signOperation";
import { broadcast } from "./broadcast";
import { validateAddress } from "./validateAddress";
import { assignFromAccountRaw } from "./assignFromAccountRaw";
import { assignToAccountRaw } from "./assignToAccountRaw";

function buildCurrencyBridge(signerContext: SignerContext<ICPSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    preload: () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
  };
}

const sync = makeSync<
  Transaction,
  ICPAccount,
  TransactionStatus,
  InternetComputerOperation,
  ICPAccountRaw
>({
  getAccountShape,
});

function buildAccountBridge(
  signerContext: SignerContext<ICPSigner>,
): AccountBridge<
  Transaction,
  ICPAccount,
  TransactionStatus,
  InternetComputerOperation,
  ICPAccountRaw
> {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction,
    assignFromAccountRaw,
    assignToAccountRaw,
    getTransactionStatus,
    prepareTransaction,
    sync,
    receive,
    signOperation,
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    broadcast,
    getSerializedAddressParameters,
    validateAddress,
  };
}

export function createBridges(signerContext: SignerContext<ICPSigner>) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
