import { AccountAwaitingSendPendingOperations } from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { CardanoNotEnoughFunds, CardanoFeeTooHigh, CardanoFeeHigh } from "./errors";
import type { CardanoAccount, CardanoOutput, Transaction, TransactionStatus } from "./types";
import coinConfig from "./config";
import { isAddressSanctioned } from "@ledgerhq/coin-framework/sanction/index";
import { AddressesSanctionedError } from "@ledgerhq/coin-framework/sanction/errors";
import { getTransactionStatusByTransactionMode } from "./getTransactionStatusByMode";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

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

  return txStatus;
};

async function findSanctionedAddressesOnUtxos(
  currency: CryptoCurrency,
  utxos: CardanoOutput[],
): Promise<string[]> {
  const sanctionedAddresses = [];
  for (const utxo of utxos) {
    const addressIsSanctioned = await isAddressSanctioned(currency, utxo.address);
    if (addressIsSanctioned) {
      sanctionedAddresses.push(utxo.address);
    }
  }

  return sanctionedAddresses;
}
