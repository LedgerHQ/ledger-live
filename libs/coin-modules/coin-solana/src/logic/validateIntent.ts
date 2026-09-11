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
import type {
  SolanaTokenAccount,
  SolanaTokenProgram,
  SolanaTxData,
  TokenRecipientDescriptor,
  TransferFeeCalculated,
} from "../types";
import type { ChainAPI } from "../network";

export async function validateIntent(
  api: ChainAPI,
  transactionIntent: TransactionIntent<StringMemo | MemoNotSupported> & { data?: SolanaTxData },
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const estimatedFees = customFees?.value ?? 0n;

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

function intentMemo(intent: TransactionIntent<StringMemo | MemoNotSupported>): string | undefined {
  return "memo" in intent && intent.memo.type === "string" ? intent.memo.value : undefined;
}

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

  const requiredSol = estimatedFees;
  const native = balances.find(b => b.asset.type === "native");
  const spendable = (native?.value ?? 0n) - (native?.locked ?? 0n);

  if (spendable < requiredSol || spendable === 0n) {
    errors.gasPrice = new NotEnoughGas(undefined, {
      fees: formatAPIValue(requiredSol),
      ticker: solanaUnit.code,
      cryptoName: solanaUnit.name,
      links: ["ledgerlive://buy?"],
    });
  }
}

async function validateTokenAuthorityIntent(
  api: ChainAPI,
  intent: TransactionIntent<StringMemo | MemoNotSupported>,
  balances: Balance[],
  estimatedFees: bigint,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  if (intent.type === "token.approve") {
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

function findStakeBalance(balances: Balance[], stakeAccAddr: string): Stake | undefined {
  return balances.find(b => b.stake?.uid === stakeAccAddr)?.stake;
}

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
        if (stake.delegate && stake.delegate !== voteAccAddr) {
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

  const stakeAccBalance = Number(await api.getBalance(intent.recipient));
  const withdrawable = Math.max(
    0,
    withdrawableFromStake({
      stakeAccBalance,
      activation: {
        state: stake.state === "withdrawable" ? "inactive" : stake.state,
        active: numericDetail(stake.details?.activeAmount),
        activating: Math.max(0, Number(stake.amount) - numericDetail(stake.details?.activeAmount)),
      },
      rentExemptReserve: numericDetail(stake.details?.lockedReserve),
    }),
  );
  if (withdrawable <= 0) {
    errors.stakeAccAddr = new SolanaStakeAccountNothingToWithdraw();
  }
}

function asAccountOrUndefined<T>(value: T | undefined | Error): T | undefined {
  return value instanceof Error ? undefined : value;
}

function numericDetail(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
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

  const reserve = await unstakeReserve(api, intent.sender);

  if (intent.useAllAmount) {
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

function tokenAmountLeavingTheAccount(amount: bigint, customFees?: FeeEstimation): bigint {
  const transferFee = customFees?.parameters?.transferFee as TransferFeeCalculated | undefined;
  if (!transferFee?.feeBps || transferFee.transferAmountIncludingFee === undefined) return amount;
  return BigInt(transferFee.transferAmountIncludingFee);
}

function liquidBalance(balances: Balance[]): bigint {
  const native = balances.find(b => b.asset.type === "native");
  const staked = balances.reduce((sum, b) => (b.stake ? sum + b.value : sum), 0n);
  return (native?.value ?? 0n) - staked;
}

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
    errors.transaction = errors.memo;
  }
}

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
