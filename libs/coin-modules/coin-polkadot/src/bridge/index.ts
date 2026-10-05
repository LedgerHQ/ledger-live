import getAddressWrapper from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import {
  updateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { PolkadotContext } from "../config";
import { POLKADOT_NULL_ADDRESS } from "../constants";
import { validateAddress } from "../logic/validateAddress";
import signerGetAddress from "../signer";
import { PolkadotAccount, PolkadotSigner, TransactionStatus, type Transaction } from "../types";
import { buildBroadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { buildEstimateMaxSpendable } from "./estimateMaxSpendable";
import { getSerializedAddressParameters } from "./exchange";
import formatters from "./formatters";
import { buildGetTransactionStatus } from "./getTransactionStatus";
import { buildPrepareTransaction } from "./prepareTransaction";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "./serialization";
import { buildSignOperation } from "./signOperation";
import { makeGetAccountShape, makeSyncBridge } from "./synchronization";

function buildCurrencyBridge(
  signerContext: SignerContext<PolkadotSigner>,
  context: PolkadotContext,
): CurrencyBridge {
  const getAddress = signerGetAddress(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape: makeGetAccountShape(context),
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    scanAccounts,
  };
}

function buildAccountBridge(
  signerContext: SignerContext<PolkadotSigner>,
  context: PolkadotContext,
): AccountBridge<Transaction, PolkadotAccount, TransactionStatus> {
  const getAddress = signerGetAddress(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext, context);

  return {
    estimateMaxSpendable: buildEstimateMaxSpendable(context),
    createTransaction,
    updateTransaction,
    getTransactionStatus: buildGetTransactionStatus(context),
    prepareTransaction: buildPrepareTransaction(context),
    sync: makeSyncBridge(context),
    receive,
    signOperation,
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    broadcast: buildBroadcast(context),
    assignFromAccountRaw,
    assignToAccountRaw,
    fromOperationExtraRaw,
    toOperationExtraRaw,
    formatAccountSpecifics: formatters.formatAccountSpecifics,
    formatOperationSpecifics: formatters.formatOperationSpecifics,
    getSerializedAddressParameters,
    validateAddress,
    getEstimationRecipient: () => POLKADOT_NULL_ADDRESS,
  };
}

export function createBridges(
  signerContext: SignerContext<PolkadotSigner>,
  context: PolkadotContext,
) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext, context),
    accountBridge: buildAccountBridge(signerContext, context),
  };
}
