import {
  AmountRequired,
  FeeNotLoaded,
  FeeRequired,
  FeeTooHigh,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import type { Account, AccountBridge, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { findSubAccountById } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import {
  MAX_MEMO_LENGTH,
  AccountAddress,
  encodePltTransferOperations,
  PLT_MAX_DECIMALS,
  PLT_MAX_MEMO_SIZE,
  PLT_TOKEN_ID_MAX_LENGTH,
  PLT_TOKEN_ID_MIN_LENGTH,
} from "@ledgerhq/concordium-core";
import coinConfig from "../config";
import { resolveSendAmount } from "./amount";
import { effectivePltAmount } from "./tokens";
import { checkRecipientRestrictions } from "../logic/transaction/pltRecipientRestrictions";
import type {
  ConcordiumAccount,
  ConcordiumCoinConfig,
  ConcordiumTokenResources,
  Transaction,
  TransactionStatus,
} from "../types";
import {
  ConcordiumInsufficientCcdForFee,
  ConcordiumInsufficientFunds,
  ConcordiumInvalidPltPayloadError,
  ConcordiumMemoTooLong,
  ConcordiumTokenAccountUnavailable,
  ConcordiumTokenPaused,
  ConcordiumTokenRestrictionsUnverified,
  ConcordiumTokenTransferNotPermitted,
  ConcordiumUnsupportedTokenDecimals,
} from "../types/errors";

function validateAmount(
  transaction: Transaction,
  account: Account,
  amount: BigNumber,
  totalSpent: BigNumber,
  reserveAmount: BigNumber,
): Error | undefined {
  if (amount.eq(0) && !transaction.useAllAmount) {
    // if the amount is 0, we prevent the user from sending the tx (even if it's technically feasible)
    // unless useAllAmount is set (which means the account has insufficient balance)
    return new AmountRequired();
  }

  if (totalSpent.gt(account.balance.minus(reserveAmount))) {
    return new ConcordiumInsufficientFunds();
  }
}

/**
 * Reported under `amount`, not `fee`.
 *
 * No file under the desktop `modals/Send/` tree reads `errors.fee`, so a fee
 * error filed there disables Continue with nothing on screen to explain it.
 * `amount` is rendered by `AmountField`, and mobile shows the first error under
 * any key either way. `coin-algorand` files `NotEnoughBalanceInParentAccount`
 * under `amount` for the same reason. See LIVE-37061.
 *
 * The `isNaN` branch is a fail-closed guard, not dead code: `fromTransactionRaw`
 * builds the fee with `new BigNumber(tr.fee)`, and a `BigNumber` holding NaN is
 * a truthy object, so it survives the `transaction.fee || 0` default.
 */
function validateFee(estimatedFees: BigNumber): Error | undefined {
  if (estimatedFees.isNaN()) {
    return new FeeNotLoaded();
  }

  if (estimatedFees.lte(0)) {
    return new FeeRequired();
  }
}

function validateMemo(memo: string): Error | undefined {
  const memoBytes = Buffer.from(memo, "utf-8").length;

  if (memoBytes > MAX_MEMO_LENGTH) {
    return new ConcordiumMemoTooLong("", {
      memoLength: memoBytes.toString(),
      maxLength: MAX_MEMO_LENGTH.toString(),
    });
  }
}

function validateRecipient(transaction: Transaction, account: Account): Error | undefined {
  if (!transaction.recipient) {
    return new RecipientRequired("");
  }

  if (transaction.recipient === account.freshAddress) {
    return new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (!AccountAddress.isValid(transaction.recipient)) {
    return new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  }
}

/**
 * Folds the token's own restrictions into one blocking error.
 *
 * Pause is read before the verdict because sync folds it in: `resolveTransferStatus`
 * returns `"blocked"` for a paused token, so the verdict alone cannot mean "a
 * list refused you".
 *
 * Neither {@link ConcordiumAccountNotAllowed} nor {@link ConcordiumAccountDenied}
 * is reachable from here — see {@link ConcordiumTokenTransferNotPermitted}.
 *
 * Gates on `!== "allowed"` rather than `=== "blocked"`, so a value from a
 * corrupted store or a newer app version blocks instead of passing.
 */
function validateTokenPolicy(state: ConcordiumTokenResources | undefined): Error | undefined {
  if (!state) return new ConcordiumTokenRestrictionsUnverified();
  if (state.paused === true) return new ConcordiumTokenPaused();
  if (state.transferStatus === "allowed") return undefined;
  if (state.transferStatus === "unknown") return new ConcordiumTokenRestrictionsUnverified();
  return new ConcordiumTokenTransferNotPermitted();
}

/**
 * An absent magnitude blocks too, but as a payload defect rather than an
 * unsupported count: there is no number to report, and its own message
 * interpolates the token's decimals. Sync only builds a sub-account whose CAL
 * magnitude matches the chain's decimals, so an absence is a data fault the user
 * cannot act on.
 */
function validateTokenDecimals(decimals: number | undefined): Error | undefined {
  if (decimals === undefined) {
    return new ConcordiumInvalidPltPayloadError("", { reason: "missing token magnitude" });
  }

  if (decimals > PLT_MAX_DECIMALS) {
    return new ConcordiumUnsupportedTokenDecimals("", {
      decimals: String(decimals),
      maxDecimals: String(PLT_MAX_DECIMALS),
    });
  }
}

/**
 * A defect rather than a rejected transaction: the id comes from CAL, so the
 * user chose a token the wallet listed and cannot act on it being out of range.
 */
function validateTokenId(tokenId: string): Error | undefined {
  const bytes = Buffer.byteLength(tokenId, "utf-8");
  if (bytes < PLT_TOKEN_ID_MIN_LENGTH || bytes > PLT_TOKEN_ID_MAX_LENGTH) {
    return new ConcordiumInvalidPltPayloadError("", {
      tokenIdLength: String(bytes),
    });
  }
}

/**
 * {@link MAX_MEMO_LENGTH} is the CCD cap and does not apply here. The device's
 * 14-byte display limit is not enforced either — see {@link PLT_MAX_MEMO_SIZE}.
 */
function validatePltMemo(memo: string): Error | undefined {
  const memoBytes = Buffer.byteLength(memo, "utf-8");

  if (memoBytes > PLT_MAX_MEMO_SIZE) {
    return new ConcordiumMemoTooLong("", {
      memoLength: memoBytes.toString(),
      maxLength: PLT_MAX_MEMO_SIZE.toString(),
    });
  }
}

/**
 * Confirms the payload the send would build stays inside the device's CBOR
 * budget.
 *
 * Close to reachable now that the memo may run to 256 bytes: `app_sizes.h` puts
 * a worst-case single transfer at ~355 of the 512 bytes. The token id is not in
 * this blob — it is a separate field, bounded by {@link validateTokenId} — so
 * the memo is what moves the total.
 *
 * Runs only once its inputs are known good, so a throw here means the size, not
 * an invalid recipient or exponent.
 */
function validatePayloadSize(
  subAccount: TokenAccount,
  transaction: Transaction,
  decimals: number,
): Error | undefined {
  try {
    encodePltTransferOperations({
      recipient: AccountAddress.fromBase58(transaction.recipient),
      amount: effectivePltAmount(subAccount, transaction),
      decimals,
      ...(transaction.memo ? { memo: Buffer.from(transaction.memo, "utf-8") } : {}),
    });
  } catch (error) {
    return new ConcordiumInvalidPltPayloadError("", {
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Status for a PLT transfer.
 *
 * Two balances, not one. The native path compares `amount + fee` against a
 * single balance; here the amount is owed to the token sub-account and the fee
 * to the parent's CCD, so an account can hold enough of the token and still
 * fail on the fee. `totalSpent` is therefore the token amount alone.
 *
 * Every value about the *sender* comes from what sync already persisted. The
 * recipient's standing under the token's lists cannot: it is another account's
 * state, which no sync of this account fetches, so it needs a lookup here. See
 * {@link checkRecipientRestrictions} for why it is here rather than in
 * `prepareTransaction`.
 */
async function getTokenTransactionStatus(
  config: ConcordiumCoinConfig,
  account: Account,
  transaction: Transaction,
  subAccount: TokenAccount,
  estimatedFees: BigNumber,
  reserveAmount: BigNumber,
): Promise<TransactionStatus> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const tokenId = subAccount.token.contractAddress;
  const decimals = subAccount.token.units[0]?.magnitude;
  const tokenState = (account as ConcordiumAccount).concordiumResources?.tokens?.[tokenId];

  const amount = resolveSendAmount({
    account,
    transaction,
    tokenAccount: subAccount,
    estimatedFees,
  });
  const totalSpent = amount;

  const recipientError = validateRecipient(transaction, account);

  // Gated on the address being usable at all, which covers empty, malformed and
  // self-transfer without restating any of them: there is nothing to look up
  // until the field holds an address, and the sender's own standing is already
  // reported under `sender`.
  const restrictionsError = recipientError
    ? undefined
    : await checkRecipientRestrictions({
        config,
        currencyId: account.currency.id,
        recipient: transaction.recipient,
        tokenId,
        ticker: subAccount.token.ticker,
      });

  const memoError = transaction.memo ? validatePltMemo(transaction.memo) : undefined;

  // `validatePayloadSize` encodes, so it runs last: it can only mean the size
  // once the exponent, recipient and memo have each been cleared. An over-long
  // memo would otherwise also surface as a payload defect on `amount`, which is
  // the field desktop renders first.
  const sizeError =
    decimals === undefined || recipientError || memoError
      ? undefined
      : validatePayloadSize(subAccount, transaction, decimals);

  // An over-long memo leaves the fee unset and is filed under `memo`, not in
  // the `amount` chain, so checking the fee here would add a bare "fee missing"
  // beside the message that names the real cause. `sizeError` is skipped alike.
  const feeError = memoError ? undefined : validateFee(estimatedFees);

  Object.assign(errors, {
    sender: validateTokenPolicy(tokenState),
    // The other two states that leave the fee unset — an absent magnitude, too
    // many decimals — have their own error above, so a bare "fee missing" only
    // surfaces once neither applies. It precedes `validateCcdForFee`, which
    // cannot judge coverage of an unset fee.
    amount:
      validateTokenDecimals(decimals) ??
      validateTokenId(tokenId) ??
      validateTokenAmount(transaction, subAccount, amount) ??
      feeError ??
      validateCcdForFee(account, estimatedFees, reserveAmount) ??
      sizeError,
    recipient: recipientError ?? restrictionsError,
  });

  Object.assign(errors, { memo: memoError });

  return {
    errors: Object.fromEntries(Object.entries(errors).filter(([, v]) => !!v)),
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
}

function validateTokenAmount(
  transaction: Transaction,
  subAccount: TokenAccount,
  amount: BigNumber,
): Error | undefined {
  if (amount.eq(0) && !transaction.useAllAmount) {
    return new AmountRequired();
  }

  if (amount.gt(subAccount.spendableBalance)) {
    return new ConcordiumInsufficientFunds();
  }
}

/**
 * The fee is paid in CCD by the parent, out of what is actually at its disposal.
 *
 * Not `balance`: the chain gates the fee on the account's *available* amount,
 * which is `total - max(stake, locked)` with stake counting both active and
 * cooldown, so an account holding most of its CCD staked would pass a
 * balance-based check and then fail on chain with `NormalTransactionInsufficientFunds`.
 * Sync stores that figure as `spendableBalance`, taking the proxy's
 * `accountAtDisposal` when it is present.
 *
 * The reserve is applied with `min` rather than subtracted, because
 * `spendableBalance` already nets it out in the branch that has no
 * `accountAtDisposal` to use — subtracting again would double-count it.
 */
function validateCcdForFee(
  account: Account,
  estimatedFees: BigNumber,
  reserveAmount: BigNumber,
): Error | undefined {
  const availableForFee = BigNumber.min(
    account.spendableBalance,
    account.balance.minus(reserveAmount),
  );

  if (estimatedFees.gt(availableForFee)) {
    return new ConcordiumInsufficientCcdForFee();
  }
}

export const getTransactionStatus: AccountBridge<
  Transaction,
  Account,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const config = coinConfig.getCoinConfig(account.currency.id);
  // reserveAmount is the minimum amount of currency that an account must hold in order to stay activated
  const reserveAmount = new BigNumber(config.minReserve);
  const estimatedFees = new BigNumber(transaction.fee || 0);

  const subAccount = findSubAccountById(account, transaction.subAccountId ?? "");
  if (subAccount?.type === "TokenAccount") {
    return getTokenTransactionStatus(
      config,
      account,
      transaction,
      subAccount,
      estimatedFees,
      reserveAmount,
    );
  }

  // Blocks rather than falling through to native validation — see
  // {@link ConcordiumTokenAccountUnavailable}.
  if (transaction.subAccountId) {
    const amount = new BigNumber(transaction.amount);
    return {
      errors: { amount: new ConcordiumTokenAccountUnavailable() },
      warnings: {},
      estimatedFees,
      amount,
      totalSpent: amount,
    };
  }

  // Calculate amount based on useAllAmount flag
  const amount = resolveSendAmount({
    account,
    transaction,
    tokenAccount: undefined,
    estimatedFees,
  });

  const totalSpent = amount.plus(estimatedFees);

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    // if the fee is more than 10 times the amount, we warn the user that fee is high compared to what he is sending
    warnings.feeTooHigh = new FeeTooHigh();
  }

  Object.assign(errors, {
    amount:
      validateAmount(transaction, account, amount, totalSpent, reserveAmount) ??
      validateFee(estimatedFees),
    recipient: validateRecipient(transaction, account),
  });

  if (transaction.memo) {
    Object.assign(errors, { memo: validateMemo(transaction.memo) });
  }

  return {
    errors: Object.fromEntries(Object.entries(errors).filter(([, v]) => !!v)),
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};
