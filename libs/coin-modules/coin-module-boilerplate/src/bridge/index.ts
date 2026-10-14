import getAddressWrapper from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { BoilerplateContext } from "../config";
import { validateAddress } from "../logic/validateAddress";
import resolver from "../signer";
import { BoilerplateSigner } from "../types";
import type { Transaction } from "../types";
import { DUMMY_RECIPIENT } from "../constants";
import { buildBroadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { buildEstimateMaxSpendable } from "./estimateMaxSpendable";
import { buildGetTransactionStatus } from "./getTransactionStatus";
import { buildPrepareTransaction } from "./prepareTransaction";
import { buildSignOperation } from "./signOperation";
import { makeGetAccountShape } from "./sync";
import { updateTransaction } from "./updateTransaction";

export function createBridges(
  signerContext: SignerContext<BoilerplateSigner>,
  context: BoilerplateContext,
) {
  const getAccountShape = makeGetAccountShape(context);
  const getAddress = resolver(signerContext);
  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));

  const scanAccounts = makeScanAccounts({ getAccountShape, getAddressFn: getAddress });
  const currencyBridge: CurrencyBridge = {
    scanAccounts,
  };

  const signOperation = buildSignOperation(signerContext, context);
  const sync = makeSync({ getAccountShape });
  // we want one method per file
  const accountBridge: AccountBridge<Transaction> = {
    broadcast: buildBroadcast(context),
    createTransaction,
    updateTransaction,
    // NOTE: use updateTransaction: defaultUpdateTransaction<Transaction>,
    // if you don't need to update the transaction patch object
    prepareTransaction: buildPrepareTransaction(context),
    getTransactionStatus: buildGetTransactionStatus(context),
    estimateMaxSpendable: buildEstimateMaxSpendable(context),
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
