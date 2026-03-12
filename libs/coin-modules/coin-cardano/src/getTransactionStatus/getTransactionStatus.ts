import { AddressesSanctionedError } from "@ledgerhq/coin-framework/sanction/errors";
import { isAddressSanctioned } from "@ledgerhq/coin-framework/sanction/index";
import { AccountAwaitingSendPendingOperations } from "@ledgerhq/errors";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import coinConfig from "../config";
import {
  CardanoNotEnoughFunds,
  CardanoFeeTooHigh,
  CardanoFeeHigh,
  CardanoMemoExceededSizeError,
} from "../errors";
import { validateMemo } from "../logic/validateMemo";
import type { CardanoAccount, CardanoOutput, Transaction, TransactionStatus } from "../types";
import { getTransactionStatusByTransactionMode } from "./handler";

export const getTransactionStatus: AccountBridge<
  Transaction,
  CardanoAccount,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  if (account.pendingOperations.length > 0) {
    throw new AccountAwaitingSendPendingOperations();
  }

  if (account.cardanoResources.utxos.length === 0) {
    const errors = {
      amount: new CardanoNotEnoughFunds(),
    };
    return Promise.resolve({
      errors,
      warnings: {},
      estimatedFees: new BigNumber(0),
      amount: new BigNumber(transaction.amount),
      totalSpent: new BigNumber(transaction.amount),
    });
  }

  const sanctionedAddressesOnUtxos = await findSanctionedAddressesOnUtxos(
    account.currency,
    account.cardanoResources.utxos,
  );
  if (sanctionedAddressesOnUtxos.length > 0) {
    const errors = {
      sender: new AddressesSanctionedError("AddressesSanctionedError", {
        addresses: sanctionedAddressesOnUtxos,
      }),
    };
    return Promise.resolve({
      errors,
      warnings: {},
      estimatedFees: new BigNumber(0),
      amount: new BigNumber(transaction.amount),
      totalSpent: new BigNumber(transaction.amount),
    });
  }

  const txStatus = await getTransactionStatusByTransactionMode(account, transaction);
  const MAX_FEES_WARN = coinConfig.getCoinConfig().maxFeesWarning;
  const MAX_FEES_THROW = coinConfig.getCoinConfig().maxFeesError;

  if (txStatus.estimatedFees.gt(MAX_FEES_THROW)) {
    throw new CardanoFeeTooHigh();
  } else if (txStatus.estimatedFees.gt(MAX_FEES_WARN)) {
    txStatus.warnings.feeTooHigh = new CardanoFeeHigh();
  }

  if (!validateMemo(transaction.memo)) {
    txStatus.errors.transaction = new CardanoMemoExceededSizeError();
  }

  return txStatus;
};

async function findSanctionedAddressesOnUtxos(
  currency: CryptoCurrency,
  utxos: CardanoOutput[],
): Promise<string[]> {
  const sanctionedAddresses = [];
  for (const utxo of utxos) {
    if (utxo?.address) {
      const addressIsSanctioned = await isAddressSanctioned(currency, utxo.address);
      if (addressIsSanctioned) {
        sanctionedAddresses.push(utxo.address);
      }
    }
  }

  return sanctionedAddresses;
}
