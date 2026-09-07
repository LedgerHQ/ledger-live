import type {
  TransactionValidation,
  TransactionIntent,
  FeeEstimation,
  Balance,
  AssetInfo,
  MemoNotSupported,
  Stake,
  StringMemo,
} from "@ledgerhq/coin-module-framework/api/types";
import {
  AmountRequired,
  FeeTooHigh,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { formatAPIValue, formatAPIValueWithCode, solanaUnit } from "../common";
import {
  isEd25519Address,
  isSolanaStakingTransactionIntent,
  isValidBase58Address,
  withdrawableFromStake,
} from "../logic";
import { MAX_MEMO_LENGTH, validateMemo } from "./validateMemo";
import {
  NotEnoughGas,
  SolanaStakeAccountAmountTooLow,
  SolanaAccountNotFunded,
  SolanaRecipientAccountNotFunded,
  SolanaTokenNonTransferable,
  SolanaAddressOffEd25519,
  SolanaMemoIsTooLong,
  SolanaMintAccountNotAllowed,
  SolanaRecipientAssociatedTokenAccountWillBeFunded,
  SolanaRecipientMemoIsRequired,
  SolanaTokenAccounNotInitialized,
  SolanaTokenAccountFrozen,
  SolanaTokenAccountHoldsAnotherToken,
  SolanaTokenAccountNotAllowed,
  SolanaTokenAccountWarning,
  SolanaInvalidValidator,
  SolanaStakeAccountIsNotDelegatable,
  SolanaStakeAccountIsNotUndelegatable,
  SolanaStakeAccountNotFound,
  SolanaStakeAccountNothingToWithdraw,
  SolanaStakeAccountRequired,
  SolanaStakeAccountValidatorIsUnchangeable,
  SolanaStakeNoStakeAuth,
  SolanaStakeNoWithdrawAuth,
  SolanaTokenRecipientIsSenderATA,
  SolanaValidatorRequired,
} from "../errors";
import type { TokenAccountInfo } from "../network/chain/account/token";
import type { MemoTransferExt } from "../network/chain/account/tokenExtensions";
import { UserInputType } from "../signer";
import {
  getMaybeMintAccount,
  getMaybeTokenAccount,
  getMaybeTokenMint,
  getMaybeVoteAccount,
  getStakeAccountMinimumBalanceForRentExemption,
} from "../network/chain/web3";
import { unstakeReserve } from "./estimateFees";
import type { SolanaTokenAccount, SolanaTokenProgram, TokenRecipientDescriptor } from "../types";
import type { ChainAPI } from "../network";

export async function validateIntent(
  api: ChainAPI,
  transactionIntent: TransactionIntent<StringMemo | MemoNotSupported> & {
    data?: { type: string; raw?: string };
  },
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const estimatedFees = customFees?.value ?? 0n;

  // A partner-built transaction describes itself; the intent's recipient and amount are
  // placeholders, so validating them would reject a perfectly good payload. Legacy did the same.
  // Keyed on `raw`, not on the family tag: `data` also carries the stake account seed of an intent
  // the wallet built itself, which must still be validated.
  if (transactionIntent.data?.type === "solana" && transactionIntent.data.raw) {
    return { errors, warnings, estimatedFees, amount: 0n, totalSpent: estimatedFees };
  }

  const isTokenTransfer = transactionIntent.asset.type !== "native";

  if (
    isSolanaStakingTransactionIntent(transactionIntent) ||
    transactionIntent.type === "stake.split"
  ) {
    return validateStakingIntent(api, transactionIntent, balances, estimatedFees);
  }

  if (transactionIntent.type.startsWith("token.") && transactionIntent.type !== "token.transfer") {
    return validateTokenAuthorityIntent(api, transactionIntent, balances, estimatedFees);
  }

  await validateRecipientCommon(
    {
      sender: transactionIntent.sender,
      recipient: transactionIntent.recipient,
      currencyName: transactionIntent.asset?.name ?? "Solana",
      allowATA: isTokenTransfer,
    },
    errors,
    warnings,
    api,
  );
  validateTransactionMemo(transactionIntent, errors);

  const amount = computeAmount(transactionIntent, balances, estimatedFees, isTokenTransfer);
  validateAmount(transactionIntent, amount, balances, estimatedFees, isTokenTransfer, errors);

  if (isTokenTransfer && transactionIntent.recipient && !errors.recipient) {
    await validateTokenTransfer(api, transactionIntent, balances, estimatedFees, errors, warnings);
  }

  if (!isTokenTransfer) {
    await validateUnfundedRecipientAmount(api, amount, warnings, errors);
  }

  // Native only: `amount` is in the token's own units on the other branch, and comparing it to
  // lamports is meaningless -- it flagged every first transfer to a recipient, whose fee carries
  // the new account's rent.
  if (!isTokenTransfer) {
    checkFeeTooHigh(amount, estimatedFees, warnings);
  }

  const totalSpent = isTokenTransfer
    ? tokenAmountLeavingTheAccount(amount, customFees)
    : amount + estimatedFees;

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
}

/**
 * An unfunded recipient wallet has to be created on-chain, which costs the rent-exempt minimum for
 * a zero-space account. Below that the transaction passes every local check and fails at broadcast.
 */
async function validateUnfundedRecipientAmount(
  api: ChainAPI,
  amount: bigint,
  warnings: Record<string, Error>,
  errors: Record<string, Error>,
): Promise<void> {
  if (errors.amount || amount <= 0n || !(warnings.recipient instanceof SolanaAccountNotFunded)) {
    return;
  }
  const recipientMinAmount = BigInt(await api.getMinimumBalanceForRentExemption(0));
  if (amount < recipientMinAmount) {
    errors.amount = new SolanaRecipientAccountNotFunded("", {
      minimumAmount: formatAPIValueWithCode(recipientMinAmount),
    });
  }
}

/** The memo text an intent carries, if any: the framework models "no memo" as its own type. */
function intentMemo(intent: TransactionIntent<StringMemo | MemoNotSupported>): string | undefined {
  return "memo" in intent && intent.memo.type === "string" ? intent.memo.value : undefined;
}

/** Solana caps memos at `MAX_MEMO_LENGTH` bytes; the device rejects anything longer. */
function validateTransactionMemo(
  intent: TransactionIntent<StringMemo | MemoNotSupported>,
  errors: Record<string, Error>,
): void {
  const memo = intentMemo(intent);
  if (typeof memo === "string" && memo.length > 0 && !validateMemo(memo)) {
    errors.transaction = errors.memo = new SolanaMemoIsTooLong(undefined, {
      maxLength: MAX_MEMO_LENGTH,
    });
  }
}

/**
 * Everything an SPL transfer needs the chain for, in one pass: where it lands, whether that
 * destination accepts it, and whether the sender holds enough SOL for the fee.
 */
async function validateTokenTransfer(
  api: ChainAPI,
  intent: TransactionIntent<StringMemo | MemoNotSupported>,
  balances: Balance[],
  estimatedFees: bigint,
  errors: Record<string, Error>,
  warnings: Record<string, Error>,
): Promise<void> {
  const mintAddress = "assetReference" in intent.asset ? intent.asset.assetReference : undefined;
  if (!mintAddress) return;

  const mintOrError = await getMaybeTokenMint(mintAddress, api);
  if (!mintOrError || mintOrError instanceof Error) return;

  // A Token-2022 mint can forbid transfers outright; nothing downstream can make one succeed.
  if (mintOrError.info.extensions?.some(ext => ext.extension === "nonTransferable")) {
    errors.amount = new SolanaTokenNonTransferable();
    return;
  }

  const tokenProgram = mintOrError.onChainAcc.data.program as SolanaTokenProgram;
  const senderAta = await api.findAssocTokenAccAddress(intent.sender, mintAddress, tokenProgram);
  if (intent.recipient === senderAta) {
    errors.recipient = new SolanaTokenRecipientIsSenderATA();
    return;
  }

  const recipientOrError = await getTokenRecipient(
    intent.recipient,
    mintAddress,
    tokenProgram,
    api,
  );
  if (recipientOrError instanceof Error) {
    errors.recipient = recipientOrError;
    return;
  }

  const { descriptor, recipientAccInfo } = recipientOrError;
  if (recipientAccInfo) {
    validateRecipientRequiredMemo(intentMemo(intent), recipientAccInfo, errors);
  }
  if (descriptor.shouldCreateAsAssociatedTokenAccount) {
    warnings.recipient = new SolanaRecipientAssociatedTokenAccountWillBeFunded();
  }

  // `estimateFees` already folds the recipient's ATA rent into the fee, so it is counted here.
  const requiredSol = estimatedFees;
  const native = balances.find(b => b.asset.type === "native");
  const spendable = (native?.value ?? 0n) - (native?.locked ?? 0n);

  if (spendable < requiredSol || spendable === 0n) {
    // The message interpolates all four: a bare `fees` leaves `{{ticker}}` and `{{cryptoName}}`
    // unresolved in the UI, and the amount reads in lamports.
    errors.gasPrice = new NotEnoughGas(undefined, {
      fees: formatAPIValue(requiredSol),
      ticker: solanaUnit.code,
      cryptoName: solanaUnit.name,
      links: ["ledgerlive://buy?"],
    });
  }
}

/**
 * The three token-authority commands, which only a live app submits. Opening or closing an account
 * moves no token, so only the native fee is at stake; approving one also names a delegate and an
 * amount.
 */
async function validateTokenAuthorityIntent(
  api: ChainAPI,
  intent: TransactionIntent<StringMemo | MemoNotSupported>,
  balances: Balance[],
  estimatedFees: bigint,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  if (intent.type === "token.approve") {
    // The same chain checks a transfer recipient gets: a delegate that is a mint or an off-curve
    // address is rejected here rather than at broadcast, as the legacy bridge did.
    await validateRecipientCommon(
      {
        sender: intent.sender,
        recipient: intent.recipient,
        currencyName: intent.asset?.name ?? "Solana",
        allowATA: true,
      },
      errors,
      warnings,
      api,
    );
    if (intent.amount <= 0n) {
      errors.amount = new AmountRequired();
    }
  }

  validateFeeCoverage(estimatedFees, liquidBalance(balances), errors);

  return {
    errors,
    warnings,
    estimatedFees,
    // No token leaves the account: approving grants an allowance, it does not spend it.
    amount: 0n,
    totalSpent: estimatedFees,
  };
}

async function validateStakingIntent(
  api: ChainAPI,
  intent: TransactionIntent,
  balances: Balance[],
  estimatedFees: bigint,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  validateStakingRecipient(intent, errors);

  const nativeBalance = balances.find(b => b.asset.type === "native");
  const available = (nativeBalance?.value ?? 0n) - (nativeBalance?.locked ?? 0n);
  const liquid = liquidBalance(balances);

  let amount: bigint;
  let totalSpent: bigint;

  switch (intent.type) {
    case "stake.createAccount": {
      await validateValidator(intent.recipient, errors, api);
      amount = await computeCreateAccountAmount(api, intent, available, estimatedFees, errors);
      totalSpent = amount + estimatedFees;
      break;
    }
    case "stake.delegate":
      await validateDelegate(api, intent, balances, errors);
      amount = 0n;
      totalSpent = estimatedFees;
      validateFeeCoverage(estimatedFees, liquid, errors);
      break;
    case "stake.undelegate":
      validateUndelegate(intent, balances, errors);
      amount = 0n;
      totalSpent = estimatedFees;
      validateFeeCoverage(estimatedFees, liquid, errors);
      break;
    case "stake.withdraw":
      await validateWithdraw(api, intent, balances, errors);
      amount = clampPositive(intent.amount);
      totalSpent = estimatedFees;
      validateFeeCoverage(estimatedFees, liquid, errors);
      break;
    case "stake.split":
      // Splitting moves lamports between two accounts the wallet owns; only the fee leaves it.
      resolveStakeAccount(intentMemo(intent) || intent.recipient, balances, errors);
      amount = clampPositive(intent.amount);
      totalSpent = estimatedFees;
      validateFeeCoverage(estimatedFees, liquid, errors);
      break;
    default:
      amount = intent.amount;
      totalSpent = estimatedFees;
      break;
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
}

/** The stake account an intent acts on, as `getBalance` reported it. */
function findStakeBalance(balances: Balance[], stakeAccAddr: string): Stake | undefined {
  return balances.find(b => b.stake?.uid === stakeAccAddr)?.stake;
}

/** Resolves the stake account an intent targets, recording why it is unusable when it is. */
function resolveStakeAccount(
  stakeAccAddr: string | undefined,
  balances: Balance[],
  errors: Record<string, Error>,
): Stake | undefined {
  if (!stakeAccAddr) {
    errors.stakeAccAddr = new SolanaStakeAccountRequired();
    return undefined;
  }
  if (!isValidBase58Address(stakeAccAddr)) {
    errors.stakeAccAddr = new InvalidAddress("", { currencyName: "Solana" });
    return undefined;
  }
  const stake = findStakeBalance(balances, stakeAccAddr);
  if (!stake) {
    errors.stakeAccAddr = new SolanaStakeAccountNotFound();
  }
  return stake;
}

function stakeAuthority(stake: Stake): { canStake: boolean; canWithdraw: boolean } {
  return {
    canStake: stake.details?.canStake !== false,
    canWithdraw: stake.details?.canWithdraw !== false,
  };
}

async function validateValidator(
  voteAccAddr: string | undefined,
  errors: Record<string, Error>,
  api: ChainAPI,
): Promise<void> {
  if (!voteAccAddr) {
    errors.voteAccAddr = new SolanaValidatorRequired();
    return;
  }
  if (!isValidBase58Address(voteAccAddr)) {
    errors.voteAccAddr = new InvalidAddress("", { currencyName: "Solana" });
    return;
  }
  const voteAcc = await getMaybeVoteAccount(voteAccAddr, api);
  if (voteAcc instanceof Error || voteAcc === undefined) {
    errors.voteAccAddr = new SolanaInvalidValidator();
  }
}

/**
 * Delegating covers both Activate (a never-delegated stake) and Reactivate (one still cooling
 * down). Solana only lets the latter go back to the validator it is leaving.
 */
async function validateDelegate(
  api: ChainAPI,
  intent: TransactionIntent<StringMemo | MemoNotSupported>,
  balances: Balance[],
  errors: Record<string, Error>,
): Promise<void> {
  const stakeAccAddr = intentMemo(intent);
  const stake = resolveStakeAccount(stakeAccAddr, balances, errors);

  const { canStake, canWithdraw } = stake
    ? stakeAuthority(stake)
    : { canStake: true, canWithdraw: true };
  if (stake && !canStake && !canWithdraw) {
    errors.stakeAccAddr = new SolanaStakeNoStakeAuth();
  }

  // `craftDelegateFromIntent` prefers `valAddress` over `recipient`; validate what will be signed.
  const valAddress = (intent as { valAddress?: string }).valAddress;
  const voteAccAddr = valAddress || intent.recipient;
  await validateValidator(voteAccAddr, errors, api);

  if (!errors.voteAccAddr && stake) {
    switch (stake.state) {
      case "active":
      case "activating":
        errors.stakeAccAddr = new SolanaStakeAccountIsNotDelegatable();
        break;
      case "deactivating":
        if (stake.delegate !== voteAccAddr) {
          errors.stakeAccAddr = new SolanaStakeAccountValidatorIsUnchangeable();
        }
        break;
      default:
        break;
    }
  }
}

function validateUndelegate(
  intent: TransactionIntent,
  balances: Balance[],
  errors: Record<string, Error>,
): void {
  const stake = resolveStakeAccount(intent.recipient, balances, errors);
  if (!stake) return;

  if (stake.state !== "active" && stake.state !== "activating") {
    errors.stakeAccAddr = new SolanaStakeAccountIsNotUndelegatable();
    return;
  }
  const { canStake, canWithdraw } = stakeAuthority(stake);
  if (!canStake && !canWithdraw) {
    errors.stakeAccAddr = new SolanaStakeNoStakeAuth();
  }
}

async function validateWithdraw(
  api: ChainAPI,
  intent: TransactionIntent,
  balances: Balance[],
  errors: Record<string, Error>,
): Promise<void> {
  const stake = resolveStakeAccount(intent.recipient, balances, errors);
  if (!stake || errors.stakeAccAddr) return;

  if (!stakeAuthority(stake).canWithdraw) {
    errors.stakeAccAddr = new SolanaStakeNoWithdrawAuth();
    return;
  }

  // Read the live lamports rather than the synced ones: a stake account drained since the last
  // sync would otherwise look withdrawable.
  const stakeAccBalance = Number(await api.getBalance(intent.recipient));
  const withdrawable = Math.max(
    0,
    withdrawableFromStake({
      stakeAccBalance,
      activation: {
        // The framework also declares `withdrawable`, which on Solana means fully deactivated.
        state: stake.state === "withdrawable" ? "inactive" : stake.state,
        active: numericDetail(stake.details?.activeAmount),
        // What the position holds beyond its effective stake is still warming up, as the legacy
        // bridge derived it.
        activating: Math.max(0, Number(stake.amount) - numericDetail(stake.details?.activeAmount)),
      },
      rentExemptReserve: numericDetail(stake.details?.lockedReserve),
    }),
  );
  if (withdrawable <= 0) {
    errors.stakeAccAddr = new SolanaStakeAccountNothingToWithdraw();
  }
}

/** Parser helpers report a schema mismatch as an `Error`; that just means "not this kind". */
function asAccountOrUndefined<T>(value: T | undefined | Error): T | undefined {
  return value instanceof Error ? undefined : value;
}

function numericDetail(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function validateStakingRecipient(intent: TransactionIntent, errors: Record<string, Error>): void {
  if (intent.recipient && !isValidBase58Address(intent.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: intent.asset?.name ?? "Solana",
    });
  }
}

async function computeCreateAccountAmount(
  api: ChainAPI,
  intent: TransactionIntent,
  available: bigint,
  estimatedFees: bigint,
  errors: Record<string, Error>,
): Promise<bigint> {
  if (!intent.recipient) {
    errors.recipient = new RecipientRequired();
  }
  const amountTooLowError = (stakeMinimumDelegation: bigint) =>
    new SolanaStakeAccountAmountTooLow("", {
      minimumAmount: formatAPIValueWithCode(stakeMinimumDelegation),
    });

  // Best-effort: if the RPC is unavailable or unsupported, skip the minimum-delegation
  // check rather than failing validation entirely.
  const fetchStakeMinimumDelegation = async (): Promise<bigint | null> => {
    try {
      return BigInt(await api.getStakeMinimumDelegation());
    } catch {
      return null;
    }
  };
  const fetchStakeAccountRentExempt = async (): Promise<bigint | null> => {
    try {
      return BigInt(await getStakeAccountMinimumBalanceForRentExemption(api));
    } catch {
      return null;
    }
  };

  // The reserve only covers the stake accounts the account already has (it is 0 when there
  // are none), so the one being created needs its own or a first-time staker cannot unstake.
  const reserve = await unstakeReserve(api, intent.sender);

  if (intent.useAllAmount) {
    // The rent exemption is already inside this amount: `craftCreateStakeAccountFromIntent`
    // subtracts it to get the delegated part.
    const allAmount = clampPositive(available - estimatedFees - reserve);
    if (!errors.recipient && !errors.amount && allAmount > 0n) {
      const [stakeMinimumDelegation, stakeAccRentExempt] = await Promise.all([
        fetchStakeMinimumDelegation(),
        fetchStakeAccountRentExempt(),
      ]);
      if (stakeMinimumDelegation !== null) {
        const delegatedAmount = clampPositive(
          stakeAccRentExempt !== null ? allAmount - stakeAccRentExempt : allAmount,
        );
        if (delegatedAmount < stakeMinimumDelegation) {
          errors.amount = amountTooLowError(stakeMinimumDelegation);
        }
      }
    }
    return allAmount;
  }
  if (intent.amount <= 0n) {
    errors.amount = new AmountRequired();
  } else if (
    // A typed amount is the delegated part; the stake account's rent sits on top of it.
    intent.amount + estimatedFees + reserve + ((await fetchStakeAccountRentExempt()) ?? 0n) >
    available
  ) {
    errors.amount = new NotEnoughBalance();
  } else if (!errors.recipient) {
    const stakeMinimumDelegation = await fetchStakeMinimumDelegation();
    if (stakeMinimumDelegation !== null && intent.amount < stakeMinimumDelegation) {
      errors.amount = amountTooLowError(stakeMinimumDelegation);
    }
  }
  return intent.amount;
}

/**
 * What a token transfer really costs the sender: a Token-2022 mint levies its fee on top of the
 * amount received, and both leave this account. `estimateFees` already computed it.
 */
function tokenAmountLeavingTheAccount(amount: bigint, customFees?: FeeEstimation): bigint {
  const transferFee = customFees?.parameters?.transferFee as
    | { feeBps?: number; transferAmountIncludingFee?: number }
    | undefined;
  if (!transferFee?.feeBps || transferFee.transferAmountIncludingFee === undefined) return amount;
  return BigInt(transferFee.transferAmountIncludingFee);
}

/**
 * Lamports the account actually holds, stake accounts excluded. `value` counts them in and `locked`
 * takes out the reserve that exists to pay these very fees, so neither answers "can this account
 * afford the fee". The account's rent exemption is not deducted -- it is not exposed here, and
 * erring on the permissive side only risks a chain-side failure, where erring the other way would
 * block a legitimate undelegate.
 */
function liquidBalance(balances: Balance[]): bigint {
  const native = balances.find(b => b.asset.type === "native");
  const staked = balances.reduce((sum, b) => (b.stake ? sum + b.value : sum), 0n);
  return (native?.value ?? 0n) - staked;
}

/** Keyed on `fee`, which is what the staking screens render (`StepValidator`, `StepAmount`). */
function validateFeeCoverage(
  estimatedFees: bigint,
  balance: bigint,
  errors: Record<string, Error>,
): void {
  if (estimatedFees > balance) {
    errors.fee = new NotEnoughBalance();
  }
}

function clampPositive(value: bigint): bigint {
  return value > 0n ? value : 0n;
}

function computeAmount(
  intent: TransactionIntent,
  balances: Balance[],
  estimatedFees: bigint,
  isTokenTransfer: boolean,
): bigint {
  if (!intent.useAllAmount) {
    return intent.amount;
  }

  if (isTokenTransfer) {
    const tokenBalance = findBalance(intent.asset, balances);
    return tokenBalance.value - (tokenBalance.locked ?? 0n);
  }

  const nativeBalance = balances.find(b => b.asset.type === "native");
  const available = (nativeBalance?.value ?? 0n) - (nativeBalance?.locked ?? 0n);
  const maxAmount = available - estimatedFees;
  return maxAmount > 0n ? maxAmount : 0n;
}

function validateAmount(
  intent: TransactionIntent,
  amount: bigint,
  balances: Balance[],
  estimatedFees: bigint,
  isTokenTransfer: boolean,
  errors: Record<string, Error>,
): void {
  if (!intent.useAllAmount && amount <= 0n) {
    errors.amount = new AmountRequired();
    return;
  }

  if (isTokenTransfer) {
    // `locked` covers a frozen token account, whose funds cannot be transferred at all.
    // `amount <= 0n` is reachable on a send-all whose whole balance is frozen: the guard above
    // lets `useAllAmount` through, and the native branch only catches it via the fee comparison.
    const tokenBalance = findBalance(intent.asset, balances);
    if (amount <= 0n || amount > tokenBalance.value - (tokenBalance.locked ?? 0n)) {
      errors.amount = new NotEnoughBalance();
    }
  } else {
    const nativeBalance = balances.find(b => b.asset.type === "native");
    const available = (nativeBalance?.value ?? 0n) - (nativeBalance?.locked ?? 0n);
    if (amount + estimatedFees > available) {
      errors.amount = new NotEnoughBalance();
    }
  }
}

function checkFeeTooHigh(
  amount: bigint,
  estimatedFees: bigint,
  warnings: Record<string, Error>,
): void {
  if (amount > 0n && estimatedFees * 10n > amount) {
    warnings.feeTooHigh = new FeeTooHigh();
  }
}

function assetsAreEqual(asset1: AssetInfo, asset2: AssetInfo): boolean {
  if (asset1.type === "native" && asset2.type === "native") return true;
  if ("assetReference" in asset1 && "assetReference" in asset2) {
    return asset1.assetReference === asset2.assetReference;
  }
  return false;
}

function findBalance(asset: AssetInfo, balances: Balance[]): Balance {
  return balances.find(b => assetsAreEqual(b.asset, asset)) ?? { asset, value: 0n };
}

async function isAccountFunded(address: string, api: ChainAPI): Promise<boolean> {
  return (await api.getBalance(address)) > 0;
}

function validateAssociatedTokenAccountState(
  tokenAcc: SolanaTokenAccount | TokenAccountInfo,
): undefined | Error {
  if (tokenAcc.state === "frozen") {
    return new SolanaTokenAccountFrozen();
  }
  // do not check initialized state on ledger accounts
  if (!("id" in tokenAcc) && tokenAcc.state !== "initialized") {
    return new SolanaTokenAccounNotInitialized();
  }
}

function validateRecipientRequiredMemo(
  memo: string | undefined,
  recipientAccInfo: TokenAccountInfo,
  errors: Record<string, Error>,
): void {
  if (!recipientAccInfo.extensions) return;

  const isRecipientMemoRequired = recipientAccInfo.extensions.some(
    ext =>
      ext.extension === "memoTransfer" &&
      (ext as MemoTransferExt).state.requireIncomingTransferMemos,
  );
  if (isRecipientMemoRequired && !memo) {
    errors.memo = new SolanaRecipientMemoIsRequired();
    // LLM expects <transaction> as error key to disable continue button
    errors.transaction = errors.memo;
  }
}

/**
 * Recipient checks common to native and token transfers: reject token and mint accounts typed in
 * as a wallet address, and warn about an unfunded or off-curve destination.
 *
 * `allowATA` is true for token transfers, where an associated token account is a legitimate
 * destination as long as it is not itself a wallet address.
 */
async function validateRecipientCommon(
  {
    sender,
    recipient,
    currencyName,
    allowATA,
  }: { sender: string; recipient: string; currencyName: string; allowATA: boolean },
  errors: Record<string, Error>,
  warnings: Record<string, Error>,
  api: ChainAPI,
): Promise<void> {
  if (!recipient) {
    errors.recipient = new RecipientRequired();
    return;
  }
  if (sender === recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    return;
  }
  if (!isValidBase58Address(recipient)) {
    errors.recipient = new InvalidAddress("", { currencyName });
    return;
  }

  const recipientWalletIsUnfunded = !(await isAccountFunded(recipient, api));

  // An `Error` from these parsers means the account did not match the schema — it simply is not a
  // token/mint account. Throwing would abort the whole status computation over an ordinary address.
  const recipientTokenAccount = asAccountOrUndefined(await getMaybeTokenAccount(recipient, api));

  if (recipientTokenAccount) {
    if (allowATA && !isEd25519Address(recipient)) {
      warnings.recipient = new SolanaTokenAccountWarning();
    } else {
      errors.recipient = new SolanaTokenAccountNotAllowed();
    }
  }

  const mintTokenAccount = asAccountOrUndefined(await getMaybeMintAccount(recipient, api));
  if (mintTokenAccount) {
    errors.recipient = new SolanaMintAccountNotAllowed();
  }

  if (recipientWalletIsUnfunded) {
    warnings.recipient = new SolanaAccountNotFunded();
  }
  if (!isEd25519Address(recipient)) {
    warnings.recipientOffCurve = new SolanaAddressOffEd25519();
  }
}

/**
 * Resolves where an SPL transfer should actually land: the recipient's own token account when one
 * was typed in, or its associated token account otherwise — creating the latter if it is missing.
 */
async function getTokenRecipient(
  recipientAddress: string,
  mintAddress: string,
  tokenProgram: SolanaTokenProgram,
  api: ChainAPI,
): Promise<
  { descriptor: TokenRecipientDescriptor; recipientAccInfo: TokenAccountInfo | undefined } | Error
> {
  const recipientTokenAccount = asAccountOrUndefined(
    await getMaybeTokenAccount(recipientAddress, api),
  );

  if (recipientTokenAccount === undefined) {
    if (!isEd25519Address(recipientAddress)) {
      return new SolanaAddressOffEd25519();
    }

    const recipientAssociatedTokenAccountAddress = await api.findAssocTokenAccAddress(
      recipientAddress,
      mintAddress,
      tokenProgram,
    );

    const shouldCreateAsAssociatedTokenAccount = !(await isAccountFunded(
      recipientAssociatedTokenAccountAddress,
      api,
    ));

    let associatedTokenAccount;

    if (!shouldCreateAsAssociatedTokenAccount) {
      associatedTokenAccount = asAccountOrUndefined(
        await getMaybeTokenAccount(recipientAssociatedTokenAccountAddress, api),
      );
      // The account is funded, so it exists; if it cannot be read there is no state to object to.
      const stateErrorOrUndefined = associatedTokenAccount
        ? validateAssociatedTokenAccountState(associatedTokenAccount)
        : undefined;
      if (stateErrorOrUndefined) return stateErrorOrUndefined;
    }

    return {
      descriptor: {
        walletAddress: recipientAddress,
        shouldCreateAsAssociatedTokenAccount,
        tokenAccAddress: recipientAssociatedTokenAccountAddress,
        userInputType: UserInputType.SOL,
      },
      recipientAccInfo: associatedTokenAccount,
    };
  }

  if (recipientTokenAccount.mint.toBase58() !== mintAddress) {
    return new SolanaTokenAccountHoldsAnotherToken();
  }
  const stateErrorOrUndefined = validateAssociatedTokenAccountState(recipientTokenAccount);
  if (stateErrorOrUndefined) return stateErrorOrUndefined;

  return {
    descriptor: {
      walletAddress: recipientTokenAccount.owner.toBase58(),
      shouldCreateAsAssociatedTokenAccount: false,
      tokenAccAddress: recipientAddress,
      userInputType: UserInputType.ATA,
    },
    recipientAccInfo: recipientTokenAccount,
  };
}
