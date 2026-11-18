import getAddressWrapper from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { CantonContext } from "../config";
import { CANTON_UNSET_RECIPIENT } from "../constants";
import resolver from "../signer";
import { CantonCurrencyBridge, CantonSigner, CantonAccount } from "../types";
import type { Transaction } from "../types";
import { buildTransferInstruction } from "./acceptOffer";
import { broadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getTransactionStatus } from "./getTransactionStatus";
import { buildOnboardAccount, buildAuthorizePreapproval } from "./onboard";
import { prepareTransaction } from "./prepareTransaction";
import { assignToAccountRaw, assignFromAccountRaw } from "./serialization";
import { buildSignOperation } from "./signOperation";
import { makeGetAccountShape } from "./sync";
import { updateTransaction } from "./updateTransaction";
import { validateAddress } from "./validateAddress";

export function createBridges(signerContext: SignerContext<CantonSigner>, context: CantonContext) {
  const getAddress = resolver(signerContext);
  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));

  const scanAccounts = makeScanAccounts({
    getAccountShape: makeGetAccountShape(signerContext, context),
    getAddressFn: getAddress,
  });

  const onboardAccount = buildOnboardAccount(signerContext, context);
  const authorizePreapproval = buildAuthorizePreapproval(signerContext, context);
  const transferInstruction = buildTransferInstruction(signerContext, context);

  const currencyBridge: CantonCurrencyBridge = {
    scanAccounts,
    onboardAccount,
    authorizePreapproval,
    transferInstruction,
  };

  const signOperation = buildSignOperation(signerContext, context);
  const sync = makeSync({ getAccountShape: makeGetAccountShape(signerContext, context) });

  const accountBridge: AccountBridge<Transaction, CantonAccount> = {
    broadcast: arg => broadcast(context, arg),
    createTransaction,
    updateTransaction,
    prepareTransaction: (account, transaction) => prepareTransaction(context, account, transaction),
    getTransactionStatus: (account, transaction) =>
      getTransactionStatus(context, account, transaction),
    estimateMaxSpendable: arg => estimateMaxSpendable(context, arg),
    sync,
    receive,
    signOperation,
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    assignToAccountRaw,
    assignFromAccountRaw,
    getSerializedAddressParameters,
    validateAddress,
    getEstimationRecipient: () => CANTON_UNSET_RECIPIENT,
  };

  return {
    currencyBridge,
    accountBridge,
  };
}
