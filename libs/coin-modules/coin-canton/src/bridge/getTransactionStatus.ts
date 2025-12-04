import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets/abandonseed";
import {
  AmountRequired,
  FeeNotLoaded,
  FeeTooHigh,
  InvalidAddress,
  NotEnoughBalanceBecauseDestinationNotCreated,
  NotEnoughSpendableBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { isRecipientValid } from "../common-logic/utils";
import { default as coinConfig } from "../config";
import { isTopologyChangeRequiredCached } from "../network/gateway";
import {
  CantonAccount,
  TooManyUtxosCritical,
  TooManyUtxosWarning,
  Transaction,
  TransactionStatus,
} from "../types";
import { TopologyChangeError } from "../types/errors";

export const TO_MANY_UTXOS_CRITICAL_COUNT = 24;
export const TO_MANY_UTXOS_WARNING_COUNT = 10;

export const getTransactionStatus: AccountBridge<
  Transaction,
  CantonAccount,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  // reserveAmount is the minimum amount of currency that an account must hold in order to stay activated
  const reserveAmount = new BigNumber(coinConfig.getCoinConfig(account.currency).minReserve || 0);
  const estimatedFees = new BigNumber(transaction.fee || 0);
  const totalSpent = new BigNumber(transaction.amount).plus(estimatedFees);
  const amount = new BigNumber(transaction.amount);

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    // if the fee is more than 10 times the amount, we warn the user that fee is high compared to what he is sending
    warnings.feeTooHigh = new FeeTooHigh();
  }

  if (transaction.fee === null || transaction.fee === undefined) {
    // if the fee is not loaded, we can't do much
    errors.fee = new FeeNotLoaded();
  } else if (totalSpent.gt(account.balance.minus(reserveAmount))) {
    // if the total spent is greater than the balance minus the reserve amount, tx is invalid
    errors.amount = new NotEnoughSpendableBalance("", {
      minimumAmount: formatCurrencyUnit(account.currency.units[0], reserveAmount, {
        disableRounding: true,
        useGrouping: false,
        showCode: true,
      }),
    });
  } else if (transaction.recipient && transaction.amount.lt(reserveAmount)) {
    // if we send an amount lower than reserve amount AND target account is new, we need to warn the user that the target account will not be activated
    errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
      minimalAmount: formatCurrencyUnit(account.currency.units[0], reserveAmount, {
        disableRounding: true,
        useGrouping: false,
        showCode: true,
      }),
    });
  }

  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (!isRecipientValid(transaction.recipient)) {
    // We want to prevent user from sending to an invalid address
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  }

  if (!errors.amount && amount.eq(0)) {
    // if the amount is 0, we prevent the user from sending the tx (even if it's technically feasible)
    errors.amount = new AmountRequired();
  }

  const utxoWarning = validateUtxoCount(account, transaction);
  if (utxoWarning) {
    warnings.tooManyUtxos = utxoWarning;
  }

  const topologyError = await validateTopology(account);
  if (topologyError) {
    errors.topologyChange = topologyError;
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};

function validateUtxoCount(account: CantonAccount, transaction: Transaction): Error | null {
  if (!account.cantonResources?.instrumentUtxoCounts) {
    return null;
  }

  if (!transaction.recipient) {
    return null;
  }

  if (!isRecipientValid(transaction.recipient) || account.xpub === transaction.recipient) {
    return null;
  }

  const abandonSeedAddress = getAbandonSeedAddress(account.currency.id);
  if (transaction.recipient.includes(abandonSeedAddress)) {
    return null;
  }

  const { instrumentUtxoCounts } = account.cantonResources;
  const instrumentUtxoCount = instrumentUtxoCounts[transaction.tokenId] || 0;

  if (instrumentUtxoCount > TO_MANY_UTXOS_CRITICAL_COUNT) {
    return new TooManyUtxosCritical();
  }

  if (instrumentUtxoCount > TO_MANY_UTXOS_WARNING_COUNT) {
    return new TooManyUtxosWarning("families.canton.tooManyUtxos.warning");
  }

  return null;
}

export async function validateTopology(account: CantonAccount): Promise<Error | null> {
  const publicKey = account.cantonResources?.publicKey;
  if (!publicKey) {
    return null;
  }

  try {
    const isTopologyChangeRequired = await isTopologyChangeRequiredCached(
      account.currency,
      publicKey,
    );

    if (!isTopologyChangeRequired) {
      return null;
    }

    return new TopologyChangeError("Topology change detected. Re-onboarding required.");
  } catch {
    // If topology check fails, don't block the transaction
    return null;
  }
}
