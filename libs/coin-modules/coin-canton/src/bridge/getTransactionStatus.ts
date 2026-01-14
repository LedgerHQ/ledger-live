import {
  AmountRequired,
  FeeNotLoaded,
  FeeTooHigh,
  InvalidAddress,
  NotEnoughBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
  NotEnoughBalanceInParentAccount,
  NotEnoughSpendableBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import {
  Transaction,
  TransactionStatus,
  CantonAccount,
  TooManyUtxosCritical,
  TooManyUtxosWarning,
} from "../types";
import { isRecipientValid } from "../common-logic/utils";
import coinConfig from "../config";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets/abandonseed";
import { isTopologyChangeRequiredCached } from "../network/gateway";
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
  const amount = new BigNumber(transaction.amount);

  const isTokenTransaction = !!transaction.subAccountId;
  // For token transactions, fees are paid from parent account, so totalSpent is just amount
  const totalSpent = isTokenTransaction ? amount : amount.plus(estimatedFees);

  // Get the account balance to check against (subAccount for tokens, main account for native)
  let accountBalance = account.spendableBalance;
  if (isTokenTransaction && account.subAccounts) {
    const subAccount = account.subAccounts.find(
      sub => sub.type === "TokenAccount" && sub.id === transaction.subAccountId,
    );
    accountBalance = subAccount?.spendableBalance ?? new BigNumber(0);
  }

  if (amount.gt(0) && estimatedFees.times(10).gt(amount) && !isTokenTransaction) {
    // if the fee is more than 10 times the amount, we warn the user that fee is high compared to what he is sending
    warnings.feeTooHigh = new FeeTooHigh();
  }

  if (transaction.fee === null || transaction.fee === undefined) {
    // if the fee is not loaded, we can't do much
    errors.fee = new FeeNotLoaded();
  }

  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (!isRecipientValid(transaction.recipient)) {
    // We want to prevent user from sending to an invalid address
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  }

  if (amount.eq(0)) {
    // if the amount is 0, we prevent the user from sending the tx (even if it's technically feasible)
    errors.amount = new AmountRequired();
  }

  // For token transactions, check that parent account has enough native balance to pay fees
  if (isTokenTransaction && estimatedFees.gt(account.balance)) {
    errors.amount = new NotEnoughBalanceInParentAccount();
  }

  // Check if total spent exceeds available balance
  if (!errors.amount && totalSpent.gt(accountBalance)) {
    errors.amount = new NotEnoughBalance();
  }

  // For native coin transactions, check reserve amount constraints
  if (!isTokenTransaction && !errors.amount) {
    if (totalSpent.gt(account.balance.minus(reserveAmount))) {
      errors.amount = new NotEnoughSpendableBalance("", {
        minimumAmount: formatCurrencyUnit(account.currency.units[0], reserveAmount, {
          disableRounding: true,
          useGrouping: false,
          showCode: true,
        }),
      });
    } else if (transaction.recipient && amount.lt(reserveAmount)) {
      // if we send an amount lower than reserve amount AND target account is new, we need to warn the user that the target account will not be activated
      errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
        minimalAmount: formatCurrencyUnit(account.currency.units[0], reserveAmount, {
          disableRounding: true,
          useGrouping: false,
          showCode: true,
        }),
      });
    }
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
  const instrumentKey = transaction.instrumentAdmin
    ? `${transaction.tokenId}-${transaction.instrumentAdmin}`
    : transaction.tokenId;
  const instrumentUtxoCount = instrumentUtxoCounts[instrumentKey] || 0;

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
