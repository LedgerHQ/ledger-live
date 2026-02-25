import { findSubAccountById, getFeesUnit } from "@ledgerhq/coin-framework/account/index";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughGas,
  RecipientRequired,
} from "@ledgerhq/errors";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import {
  SolanaAccountNotFunded,
  SolanaTokenAccountFrozen,
  SolanaAddressOffEd25519,
  SolanaInvalidValidator,
  SolanaMemoIsTooLong,
  SolanaRecipientAssociatedTokenAccountWillBeFunded,
  SolanaStakeAccountIsNotDelegatable,
  SolanaStakeAccountIsNotUndelegatable,
  SolanaStakeAccountNotFound,
  SolanaStakeAccountNothingToWithdraw,
  SolanaStakeAccountRequired,
  SolanaStakeAccountValidatorIsUnchangeable,
  SolanaStakeNoStakeAuth,
  SolanaStakeNoWithdrawAuth,
  SolanaTokenAccounNotInitialized,
  SolanaTokenAccountHoldsAnotherToken,
  SolanaTokenRecipientIsSenderATA,
  SolanaValidatorRequired,
  SolanaTokenAccountNotAllowed,
  SolanaMintAccountNotAllowed,
  SolanaTokenAccountWarning,
  SolanaTokenNonTransferable,
  SolanaRecipientMemoIsRequired,
} from "./errors";
import { estimateFeeAndSpendable, estimateTokenMaxSpendable } from "./estimateMaxSpendable";
import { calculateToken2022TransferFees } from "./helpers/token";
import {
  decodeAccountIdWithTokenAccountAddress,
  isEd25519Address,
  isValidBase58Address,
} from "./logic";
import { MAX_MEMO_LENGTH, validateMemo } from "./logic/validateMemo";
import { ChainAPI } from "./network";
import { TokenAccountInfo } from "./network/chain/account/token";
import { MemoTransferExt, TransferFeeConfigExt } from "./network/chain/account/tokenExtensions";
import {
  getMaybeMintAccount,
  getMaybeTokenAccount,
  getMaybeTokenMint,
  getMaybeTokenMintProgram,
  getMaybeVoteAccount,
  getStakeAccountAddressWithSeed,
  getStakeAccountMinimumBalanceForRentExemption,
  ParsedOnChainMintWithInfo,
} from "./network/chain/web3";
import { deriveRawCommandDescriptor, toLiveTransaction } from "./rawTransaction";
import { UserInputType } from "./signer";
import type {
  CommandDescriptor,
  SolanaAccount,
  SolanaStake,
  SolanaTokenAccount,
  SolanaTokenProgram,
  StakeCreateAccountCommand,
  StakeCreateAccountTransaction,
  StakeDelegateTransaction,
  StakeSplitTransaction,
  StakeUndelegateTransaction,
  StakeWithdrawTransaction,
  TokenCreateApproveTransaction,
  TokenCreateATATransaction,
  TokenCreateRevokeTransaction,
  TokenRecipientDescriptor,
  TokenTransferTransaction,
  Transaction,
  TransactionModel,
  TransferCommand,
  TransferTransaction,
} from "./types";
import { assertUnreachable } from "./utils";

async function deriveCommandDescriptor(
  mainAccount: SolanaAccount,
  tx: Transaction,
  api: ChainAPI,
): Promise<CommandDescriptor> {
  const { model } = tx;
  switch (model.kind) {
    case "transfer":
      return deriveTransferCommandDescriptor(mainAccount, tx, model, api);
    case "token.transfer":
      return deriveTokenTransferCommandDescriptor(mainAccount, tx, model, api);
    case "token.createATA":
      return deriveCreateAssociatedTokenAccountCommandDescriptor(mainAccount, tx, model, api);
    case "token.approve":
      return deriveCreateApproveCommandDescriptor(mainAccount, tx, model, api);
    case "token.revoke":
      return deriveCreateRevokeCommandDescriptor(mainAccount, tx, model, api);
    case "stake.createAccount":
      return deriveStakeCreateAccountCommandDescriptor(mainAccount, tx, model, api);
    case "stake.delegate":
      return deriveStakeDelegateCommandDescriptor(mainAccount, tx, model, api);
    case "stake.undelegate":
      return deriveStakeUndelegateCommandDescriptor(mainAccount, tx, model, api);
    case "stake.withdraw":
      return deriveStakeWithdrawCommandDescriptor(mainAccount, tx, model, api);
    case "stake.split":
      return deriveStakeSplitCommandDescriptor(mainAccount, tx, model, api);
    case "raw":
      return deriveRawCommandDescriptor(tx, api);
    default:
      return assertUnreachable(model);
  }
}

const prepareTransaction = async (
  mainAccount: SolanaAccount,
  tx: Transaction,
  api: ChainAPI,
): Promise<Transaction> => {
  if (tx.raw) {
    return toLiveTransaction(api, tx.raw);
  }

  const txToDeriveFrom = updateModelIfSubAccountIdPresent(tx);

  const commandDescriptor = await deriveCommandDescriptor(mainAccount, txToDeriveFrom, api);

  const model: TransactionModel = {
    ...tx.model,
    commandDescriptor,
  };

  const patch: Partial<Transaction> = {
    model,
  };

  return updateTransaction(tx, patch);
};

const deriveTokenTransferCommandDescriptor = async (
  mainAccount: Account,
  tx: Transaction,
  model: TransactionModel & { kind: TokenTransferTransaction["kind"] },
  api: ChainAPI,
): Promise<CommandDescriptor> => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const subAccount = findSubAccountById(mainAccount, model.uiState.subAccountId);

  if (!subAccount || subAccount.type !== "TokenAccount") {
    throw new Error("subaccount not found");
  }

  const tokenAccount: SolanaTokenAccount = subAccount;

  const stateErrorOrUndefined = validateAssociatedTokenAccountState(tokenAccount);
  if (stateErrorOrUndefined) {
    errors.amount = stateErrorOrUndefined;
  }

  await validateRecipientCommon(mainAccount, tx, errors, warnings, api, true);

  const memo = model.uiState.memo;

  if (typeof memo === "string" && memo.length > 0 && !validateMemo(memo)) {
    errors.transaction = errors.memo = new SolanaMemoIsTooLong(undefined, {
      maxLength: MAX_MEMO_LENGTH,
    });
  }

  const mintAddress = tokenAccount.token.contractAddress;
  const mintDecimals = tokenAccount.token.units[0].magnitude;

  const mintOrError = await getMaybeTokenMint(mintAddress, api);

  if (!mintOrError) throw new Error(`Mint ${mintAddress} not found`);
  if (mintOrError instanceof Error) throw mintOrError;

  const tokenProgram = mintOrError.onChainAcc.data.program as SolanaTokenProgram;

  const senderAssociatedTokenAccountAddress = decodeAccountIdWithTokenAccountAddress(
    tokenAccount.id,
  ).address;

  if (!errors.recipient && tx.recipient === senderAssociatedTokenAccountAddress) {
    errors.recipient = new SolanaTokenRecipientIsSenderATA();
  }

  const defaultRecipientDescriptor: TokenRecipientDescriptor = {
    shouldCreateAsAssociatedTokenAccount: false,
    tokenAccAddress: "",
    walletAddress: "",
    userInputType: UserInputType.SOL,
  };

  const tokenRecipientOrError = errors.recipient
    ? errors.recipient
    : await getTokenRecipient(tx.recipient, mintAddress, tokenProgram, api);

  if (!errors.recipient && tokenRecipientOrError instanceof Error) {
    errors.recipient = tokenRecipientOrError;
  }

  const recipientDescriptor: TokenRecipientDescriptor =
    tokenRecipientOrError instanceof Error
      ? defaultRecipientDescriptor
      : tokenRecipientOrError.descriptor;

  if (!(tokenRecipientOrError instanceof Error) && tokenRecipientOrError.recipientAccInfo) {
    validateRecipientRequiredMemo(memo, tokenRecipientOrError.recipientAccInfo, errors);
  }

  const assocAccRentExempt = recipientDescriptor.shouldCreateAsAssociatedTokenAccount
    ? await api.getAssocTokenAccMinNativeBalance()
    : 0;

  if (recipientDescriptor.shouldCreateAsAssociatedTokenAccount) {
    warnings.recipient = new SolanaRecipientAssociatedTokenAccountWillBeFunded();
  }

  const { fee, spendable: spendableSol } = await estimateFeeAndSpendable(api, mainAccount, tx);

  if (spendableSol.lt(assocAccRentExempt) || spendableSol.isZero()) {
    const query = new URLSearchParams({
      ...(mainAccount?.id ? { account: mainAccount.id } : {}),
    });
    errors.gasPrice = new NotEnoughGas(undefined, {
      fees: formatCurrencyUnit(getFeesUnit(mainAccount.currency), new BigNumber(fee)),
      ticker: mainAccount.currency.ticker,
      cryptoName: mainAccount.currency.name,
      links: [`ledgerlive://buy?${query.toString()}`],
    });
  }

  if (!tx.useAllAmount && tx.amount.lte(0)) {
    errors.amount = new AmountRequired();
  }

  const spendableBalance = await estimateTokenMaxSpendable(api, tokenAccount, tx);
  const txAmount = tx.useAllAmount ? spendableBalance.toNumber() : tx.amount.toNumber();

  if (!errors.amount && txAmount > spendableBalance.toNumber()) {
    errors.amount = new NotEnoughBalance();
  }

  if (mintOrError.info.extensions?.some(ext => ext.extension === "nonTransferable")) {
    throw new SolanaTokenNonTransferable();
  }

  const transferFeeCalculatedConfig = await getMaybeTransferFee(txAmount, mintOrError, api);

  return {
    command: {
      kind: "token.transfer",
      ownerAddress: mainAccount.freshAddress,
      ownerAssociatedTokenAccountAddress: senderAssociatedTokenAccountAddress,
      amount: txAmount,
      mintAddress,
      mintDecimals,
      tokenId: tokenAccount.token.id,
      recipientDescriptor: recipientDescriptor,
      memo: model.uiState.memo,
      tokenProgram: tokenProgram,
      extensions: {
        transferFee: transferFeeCalculatedConfig,
      },
    },
    fee: fee + assocAccRentExempt,
    warnings,
    errors,
  };
};

async function getMaybeTransferFee(
  txAmount: number,
  mint: ParsedOnChainMintWithInfo,
  api: ChainAPI,
) {
  const transferFeeConfigExt = mint.info.extensions?.find(
    tokenExt => tokenExt.extension === "transferFeeConfig",
  ) as TransferFeeConfigExt;
  if (!transferFeeConfigExt) return;

  const { epoch } = await api.getEpochInfo();

  return calculateToken2022TransferFees({
    transferAmount: txAmount,
    transferFeeConfigState: transferFeeConfigExt.state,
    currentEpoch: epoch,
  });
}

async function getTokenRecipient(
  recipientAddress: string,
  mintAddress: string,
  tokenProgram: SolanaTokenProgram,
  api: ChainAPI,
): Promise<
  { descriptor: TokenRecipientDescriptor; recipientAccInfo: TokenAccountInfo | undefined } | Error
> {
  const recipientTokenAccount = await getMaybeTokenAccount(recipientAddress, api);

  if (recipientTokenAccount instanceof Error) {
    throw recipientTokenAccount;
  }

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
      associatedTokenAccount = await getMaybeTokenAccount(
        recipientAssociatedTokenAccountAddress,
        api,
      );
      if (associatedTokenAccount instanceof Error) throw recipientTokenAccount;
      if (!associatedTokenAccount) {
        // TODO create a better error
        throw new Error(`Token account ${recipientAssociatedTokenAccountAddress} not found!`);
      }

      const stateErrorOrUndefined = validateAssociatedTokenAccountState(associatedTokenAccount);
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
  } else {
    if (recipientTokenAccount.mint.toBase58() !== mintAddress) {
      return new SolanaTokenAccountHoldsAnotherToken();
    }
    const stateErrorOrUndefined = validateAssociatedTokenAccountState(recipientTokenAccount);
    if (stateErrorOrUndefined) return stateErrorOrUndefined;
  }

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

async function deriveCreateAssociatedTokenAccountCommandDescriptor(
  mainAccount: Account,
  tx: Transaction,
  model: TransactionModel & { kind: TokenCreateATATransaction["kind"] },
  api: ChainAPI,
): Promise<CommandDescriptor> {
  const errors: Record<string, Error> = {};

  const token = await getCryptoAssetsStore().findTokenById(model.uiState.tokenId);
  if (!token) {
    throw new Error("Token " + model.uiState.tokenId + " not found");
  }
  const mint = token.contractAddress;
  const tokenProgram = await getMaybeTokenMintProgram(mint, api);

  if (!tokenProgram || tokenProgram instanceof Error) {
    throw new Error("Mint not found");
  }

  const associatedTokenAccountAddress = await api.findAssocTokenAccAddress(
    mainAccount.freshAddress,
    mint,
    tokenProgram,
  );

  const { fee } = await estimateFeeAndSpendable(api, mainAccount, tx);

  if (mainAccount.spendableBalance.lt(fee)) {
    errors.fee = new NotEnoughBalance();
  }

  return {
    fee,
    command: {
      kind: "token.createATA",
      mint: mint,
      owner: mainAccount.freshAddress,
      associatedTokenAccountAddress,
    },
    warnings: {},
    errors,
  };
}

async function deriveTransferCommandDescriptor(
  mainAccount: Account,
  tx: Transaction,
  model: TransactionModel & { kind: TransferTransaction["kind"] },
  api: ChainAPI,
): Promise<CommandDescriptor> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  await validateRecipientCommon(mainAccount, tx, errors, warnings, api, false);

  const memo = model.uiState.memo;

  if (typeof memo === "string" && memo.length > 0 && !validateMemo(memo)) {
    errors.transaction = errors.memo = new SolanaMemoIsTooLong(undefined, {
      maxLength: MAX_MEMO_LENGTH,
    });
  }

  const { fee, spendable } = await estimateFeeAndSpendable(api, mainAccount, tx);
  const txAmount = tx.useAllAmount ? spendable : tx.amount;

  if (tx.useAllAmount) {
    if (txAmount.eq(0)) {
      errors.amount = new NotEnoughBalance();
    }
  } else {
    if (txAmount.lte(0)) {
      errors.amount = new AmountRequired();
    } else if (txAmount.gt(spendable)) {
      errors.amount = new NotEnoughBalance();
    }
  }

  const command: TransferCommand = {
    kind: "transfer",
    amount: txAmount.toNumber(),
    sender: mainAccount.freshAddress,
    recipient: tx.recipient,
    memo: model.uiState.memo,
  };

  return {
    command,
    fee,
    warnings,
    errors,
  };
}

async function deriveCreateApproveCommandDescriptor(
  mainAccount: Account,
  tx: Transaction,
  model: TransactionModel & { kind: TokenCreateApproveTransaction["kind"] },
  api: ChainAPI,
): Promise<CommandDescriptor> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const subAccount = findSubAccountById(mainAccount, model.uiState.subAccountId);
  if (!subAccount || subAccount.type !== "TokenAccount") {
    throw new Error("subaccount not found");
  }

  const tokenAccount: SolanaTokenAccount = subAccount;

  const stateErrorOrUndefined = validateAssociatedTokenAccountState(tokenAccount);
  if (stateErrorOrUndefined) {
    errors.amount = stateErrorOrUndefined;
  }

  await validateRecipientCommon(mainAccount, tx, errors, warnings, api, true);

  const mintAddress = tokenAccount.token.contractAddress;
  const mintDecimals = tokenAccount.token.units[0].magnitude;

  const mintOrError = await getMaybeTokenMint(mintAddress, api);
  if (!mintOrError) throw new Error(`Mint ${mintAddress} not found`);
  if (mintOrError instanceof Error) throw mintOrError;

  const tokenProgram = await getMaybeTokenMintProgram(mintAddress, api);
  if (!tokenProgram || tokenProgram instanceof Error) {
    throw new Error("Mint not found");
  }

  const senderAssociatedTokenAccountAddress = decodeAccountIdWithTokenAccountAddress(
    tokenAccount.id,
  ).address;

  if (!errors.recipient && tx.recipient === senderAssociatedTokenAccountAddress) {
    errors.recipient = new SolanaTokenRecipientIsSenderATA();
  }

  const defaultRecipientDescriptor: TokenRecipientDescriptor = {
    shouldCreateAsAssociatedTokenAccount: false,
    tokenAccAddress: "",
    walletAddress: "",
    userInputType: UserInputType.SOL,
  };

  const tokenRecipientOrError = errors.recipient
    ? errors.recipient
    : await getTokenRecipient(tx.recipient, mintAddress, tokenProgram, api);

  if (!errors.recipient && tokenRecipientOrError instanceof Error) {
    errors.recipient = tokenRecipientOrError;
  }

  const recipientDescriptor: TokenRecipientDescriptor =
    tokenRecipientOrError instanceof Error
      ? defaultRecipientDescriptor
      : tokenRecipientOrError.descriptor;

  const { fee, spendable } = await estimateFeeAndSpendable(api, mainAccount, tx);
  const txAmount = tx.useAllAmount ? spendable : tx.amount;

  if (tx.useAllAmount) {
    if (txAmount.eq(0)) {
      errors.amount = new NotEnoughBalance();
    }
  } else {
    if (txAmount.lte(0)) {
      errors.amount = new AmountRequired();
    } else if (txAmount.gt(spendable)) {
      errors.amount = new NotEnoughBalance();
    }
  }

  return {
    fee,
    command: {
      kind: "token.approve",
      account: senderAssociatedTokenAccountAddress,
      mintAddress: mintAddress,
      recipientDescriptor: recipientDescriptor,
      owner: mainAccount.freshAddress,
      amount: txAmount.toNumber(),
      decimals: mintDecimals,
      tokenProgram: tokenProgram,
    },
    warnings: {},
    errors,
  };
}

async function deriveCreateRevokeCommandDescriptor(
  mainAccount: Account,
  tx: Transaction,
  model: TransactionModel & { kind: TokenCreateRevokeTransaction["kind"] },
  api: ChainAPI,
): Promise<CommandDescriptor> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const subAccount = findSubAccountById(mainAccount, model.uiState.subAccountId);
  if (!subAccount || subAccount.type !== "TokenAccount") {
    throw new Error("subaccount not found");
  }

  const tokenAccount: SolanaTokenAccount = subAccount;
  const stateErrorOrUndefined = validateAssociatedTokenAccountState(tokenAccount);
  if (stateErrorOrUndefined) {
    errors.amount = stateErrorOrUndefined;
  }

  await validateRecipientCommon(mainAccount, tx, errors, warnings, api, true);

  const mintAddress = tokenAccount.token.contractAddress;
  const tokenProgram = await getMaybeTokenMintProgram(mintAddress, api);
  if (!tokenProgram || tokenProgram instanceof Error) {
    throw new Error("Mint not found");
  }

  const senderAssociatedTokenAccountAddress = decodeAccountIdWithTokenAccountAddress(
    tokenAccount.id,
  ).address;

  if (!errors.recipient && tx.recipient === senderAssociatedTokenAccountAddress) {
    errors.recipient = new SolanaTokenRecipientIsSenderATA();
  }

  const { fee } = await estimateFeeAndSpendable(api, mainAccount, tx);

  return {
    fee,
    command: {
      kind: "token.revoke",
      account: senderAssociatedTokenAccountAddress,
      owner: mainAccount.freshAddress,
      tokenProgram: tokenProgram,
    },
    warnings: {},
    errors,
  };
}

async function deriveStakeCreateAccountCommandDescriptor(
  mainAccount: Account,
  tx: Transaction,
  model: TransactionModel & { kind: StakeCreateAccountTransaction["kind"] },
  api: ChainAPI,
): Promise<CommandDescriptor> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const commandDescriptor = tx.model.commandDescriptor;
  if (isValidStakeCreateAccountCommandDescriptor(commandDescriptor, tx.amount.toNumber()))
    return commandDescriptor;

  const { fee, spendable } = await estimateFeeAndSpendable(api, mainAccount, tx);
  const txAmount = tx.useAllAmount ? spendable : tx.amount;

  if (tx.useAllAmount) {
    if (txAmount.eq(0)) {
      errors.amount = new NotEnoughBalance();
    }
  } else {
    if (txAmount.lte(0)) {
      errors.amount = new AmountRequired();
    } else if (txAmount.gt(spendable)) {
      errors.amount = new NotEnoughBalance();
    }
  }

  const {
    uiState: { delegate },
  } = model;

  await validateValidatorCommon(delegate.voteAccAddress, errors, api);

  const stakeAccAddressSeed = `stake:${Math.random().toString()}`;
  const stakeAccAddress = await getStakeAccountAddressWithSeed({
    fromAddress: mainAccount.freshAddress,
    seed: stakeAccAddressSeed,
  });
  const stakeAccRentExemptAmount = await getStakeAccountMinimumBalanceForRentExemption(api);

  return {
    command: {
      kind: "stake.createAccount",
      amount: txAmount.toNumber(),
      stakeAccRentExemptAmount,
      fromAccAddress: mainAccount.freshAddress,
      stakeAccAddress,
      delegate,
      seed: stakeAccAddressSeed,
    },
    fee,
    warnings,
    errors,
  };
}

async function deriveStakeDelegateCommandDescriptor(
  mainAccount: SolanaAccount,
  tx: Transaction,
  model: TransactionModel & { kind: StakeDelegateTransaction["kind"] },
  api: ChainAPI,
): Promise<CommandDescriptor> {
  const errors: Record<string, Error> = {};

  const { uiState } = model;

  const stake = validateAndTryGetStakeAccount(mainAccount, uiState.stakeAccAddr, errors);

  if (stake !== undefined && !stake.hasStakeAuth && !stake.hasWithdrawAuth) {
    errors.stakeAccAddr = new SolanaStakeNoStakeAuth();
  }

  await validateValidatorCommon(uiState.voteAccAddr, errors, api);

  if (!errors.voteAccAddr && stake !== undefined) {
    switch (stake.activation.state) {
      case "active":
      case "activating":
        errors.stakeAccAddr = new SolanaStakeAccountIsNotDelegatable();
        break;
      case "inactive":
        break;
      case "deactivating":
        if (stake.delegation?.voteAccAddr !== uiState.voteAccAddr) {
          errors.stakeAccAddr = new SolanaStakeAccountValidatorIsUnchangeable();
        }
        break;
      default:
        return assertUnreachable(stake.activation.state);
    }
  }

  const { fee } = await estimateFeeAndSpendable(api, mainAccount, tx);

  if (mainAccount.spendableBalance.lt(fee)) {
    errors.fee = new NotEnoughBalance();
  }

  return {
    command: {
      kind: "stake.delegate",
      authorizedAccAddr: mainAccount.freshAddress,
      stakeAccAddr: uiState.stakeAccAddr,
      voteAccAddr: uiState.voteAccAddr,
    },
    fee,
    warnings: {},
    errors,
  };
}

async function deriveStakeUndelegateCommandDescriptor(
  mainAccount: SolanaAccount,
  tx: Transaction,
  model: TransactionModel & { kind: StakeUndelegateTransaction["kind"] },
  api: ChainAPI,
): Promise<CommandDescriptor> {
  const errors: Record<string, Error> = {};

  const { uiState } = model;

  const stake = validateAndTryGetStakeAccount(mainAccount, uiState.stakeAccAddr, errors);

  if (stake !== undefined) {
    switch (stake.activation.state) {
      case "active":
      case "activating":
        break;
      case "inactive":
      case "deactivating":
        errors.stakeAccAddr = new SolanaStakeAccountIsNotUndelegatable();
        break;
      default:
        return assertUnreachable(stake.activation.state);
    }

    if (!errors.stakeAccAddr && !stake.hasStakeAuth && !stake.hasWithdrawAuth) {
      errors.stakeAccAddr = new SolanaStakeNoStakeAuth();
    }
  }

  const { fee } = await estimateFeeAndSpendable(api, mainAccount, tx);
  if (mainAccount.solanaResources.unstakeReserve.lt(fee)) {
    errors.fee = new NotEnoughBalance();
  }

  return {
    command: {
      kind: "stake.undelegate",
      authorizedAccAddr: mainAccount.freshAddress,
      stakeAccAddr: uiState.stakeAccAddr,
    },
    fee,
    warnings: {},
    errors,
  };
}

async function deriveStakeWithdrawCommandDescriptor(
  mainAccount: SolanaAccount,
  tx: Transaction,
  model: TransactionModel & { kind: StakeWithdrawTransaction["kind"] },
  api: ChainAPI,
): Promise<CommandDescriptor> {
  const errors: Record<string, Error> = {};
  const { uiState } = model;

  const stake = validateAndTryGetStakeAccount(mainAccount, uiState.stakeAccAddr, errors);

  if (!errors.stakeAccAddr && stake !== undefined) {
    if (!stake.hasWithdrawAuth) {
      errors.stakeAccAddr = new SolanaStakeNoWithdrawAuth();
    } else if (stake.withdrawable <= 0) {
      errors.stakeAccAddr = new SolanaStakeAccountNothingToWithdraw();
    }
  }

  const { fee } = await estimateFeeAndSpendable(api, mainAccount, tx);
  if (mainAccount.solanaResources.unstakeReserve.lt(fee)) {
    errors.fee = new NotEnoughBalance();
  }

  return {
    command: {
      kind: "stake.withdraw",
      authorizedAccAddr: mainAccount.freshAddress,
      stakeAccAddr: uiState.stakeAccAddr,
      amount: stake?.withdrawable ?? 0,
      toAccAddr: mainAccount.freshAddress,
    },
    fee,
    warnings: {},
    errors,
  };
}

async function deriveStakeSplitCommandDescriptor(
  mainAccount: SolanaAccount,
  tx: Transaction,
  model: TransactionModel & { kind: StakeSplitTransaction["kind"] },
  api: ChainAPI,
): Promise<CommandDescriptor> {
  const errors: Record<string, Error> = {};

  // TODO: find stake account in the main acc when synced
  const { uiState } = model;

  // TODO: use all amount
  if (tx.amount.lte(0)) {
    errors.amount = new AmountRequired();
  }
  // TODO: else if amount > stake balance

  if (!isValidBase58Address(uiState.stakeAccAddr)) {
    errors.stakeAccAddr = new InvalidAddress("", {
      currencyName: mainAccount.currency.name,
    });
  }

  mainAccount.solanaResources?.stakes ?? [];

  const commandFees = await getStakeAccountMinimumBalanceForRentExemption(api);

  const splitStakeAccAddrSeed = `stake:${Math.random().toString()}`;
  const splitStakeAccAddr = await getStakeAccountAddressWithSeed({
    fromAddress: mainAccount.freshAddress,
    seed: splitStakeAccAddrSeed,
  });

  return {
    command: {
      kind: "stake.split",
      authorizedAccAddr: mainAccount.freshAddress,
      stakeAccAddr: uiState.stakeAccAddr,
      amount: tx.amount.toNumber(),
      seed: splitStakeAccAddrSeed,
      splitStakeAccAddr,
    },
    fee: commandFees,
    warnings: {},
    errors: {},
  };
}

// if subaccountid present - it's a token transfer
function updateModelIfSubAccountIdPresent(tx: Transaction): Transaction {
  if (tx.subAccountId && tx.model.kind === "transfer") {
    return {
      ...tx,
      model: {
        kind: "token.transfer",
        uiState: {
          ...tx.model.uiState,
          subAccountId: tx.subAccountId,
        },
      },
    };
  }
  if (
    tx.subAccountId &&
    // Using this instead of includes to get proper type narrowing
    (tx.model.kind === "token.transfer" ||
      tx.model.kind === "token.approve" ||
      tx.model.kind === "token.revoke")
  ) {
    return {
      ...tx,
      model: {
        ...tx.model,
        uiState: {
          ...tx.model.uiState,
          subAccountId: tx.subAccountId,
        },
      },
    };
  }

  return tx;
}

async function isAccountFunded(address: string, api: ChainAPI): Promise<boolean> {
  const balance = await api.getBalance(address);
  return balance > 0;
}

async function validateRecipientCommon(
  mainAccount: Account,
  tx: Transaction,
  errors: Record<string, Error>,
  warnings: Record<string, Error>,
  api: ChainAPI,
  allowATA: boolean,
) {
  if (!tx.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (mainAccount.freshAddress === tx.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!isValidBase58Address(tx.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: mainAccount.currency.name,
    });
  } else {
    const recipientWalletIsUnfunded = !(await isAccountFunded(tx.recipient, api));

    const recipientTokenAccount = await getMaybeTokenAccount(tx.recipient, api);

    if (recipientTokenAccount instanceof Error) {
      throw recipientTokenAccount;
    }

    if (recipientTokenAccount) {
      if (allowATA) {
        if (isEd25519Address(tx.recipient)) {
          errors.recipient = new SolanaTokenAccountNotAllowed();
        } else {
          warnings.recipient = new SolanaTokenAccountWarning();
        }
      } else {
        errors.recipient = new SolanaTokenAccountNotAllowed();
      }
    }

    // TODO update to a shared method
    const mintTokenAccount = await getMaybeMintAccount(tx.recipient, api);

    if (mintTokenAccount instanceof Error) {
      throw mintTokenAccount;
    }

    if (mintTokenAccount) {
      errors.recipient = new SolanaMintAccountNotAllowed();
    }

    if (recipientWalletIsUnfunded) {
      warnings.recipient = new SolanaAccountNotFunded();
    }
    if (!isEd25519Address(tx.recipient)) {
      warnings.recipientOffCurve = new SolanaAddressOffEd25519();
    }
  }
}

async function validateValidatorCommon(addr: string, errors: Record<string, Error>, api: ChainAPI) {
  if (addr.length === 0) {
    errors.voteAccAddr = new SolanaValidatorRequired();
  } else if (!isValidBase58Address(addr)) {
    errors.voteAccAddr = new InvalidAddress("", {
      currencyName: "Solana",
    });
  } else {
    const voteAcc = await getMaybeVoteAccount(addr, api);

    if (voteAcc instanceof Error || voteAcc === undefined) {
      errors.voteAccAddr = new SolanaInvalidValidator();
    }
  }
}

function validateAndTryGetStakeAccount(
  account: SolanaAccount,
  stakeAccAddr: string,
  errors: Record<string, Error>,
): SolanaStake | undefined {
  if (stakeAccAddr.length === 0) {
    errors.stakeAccAddr = new SolanaStakeAccountRequired();
  } else if (!isValidBase58Address(stakeAccAddr)) {
    errors.stakeAccAddr = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  }

  if (!errors.stakeAccAddr) {
    const stake = account.solanaResources?.stakes.find(
      stake => stake.stakeAccAddr === stakeAccAddr,
    );

    if (stake === undefined) {
      errors.stakeAccAddr = new SolanaStakeAccountNotFound();
    }

    return stake;
  }

  return undefined;
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
) {
  if (!recipientAccInfo.extensions) return;

  const isRecipientMemoRequired = recipientAccInfo.extensions?.find(
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

function isValidStakeCreateAccountCommandDescriptor(
  commandDescriptor: CommandDescriptor | undefined,
  amount: number,
): commandDescriptor is CommandDescriptor {
  const txCommand = commandDescriptor?.command as StakeCreateAccountCommand | undefined;

  // Ensures commandDescriptor has all required data, avoiding regeneration
  if (
    commandDescriptor &&
    txCommand?.amount &&
    txCommand.amount === amount &&
    txCommand.stakeAccRentExemptAmount &&
    txCommand.fromAccAddress &&
    txCommand.stakeAccAddress &&
    txCommand.delegate &&
    txCommand.seed &&
    commandDescriptor.fee
  ) {
    return true;
  }

  return false;
}

export { prepareTransaction };
