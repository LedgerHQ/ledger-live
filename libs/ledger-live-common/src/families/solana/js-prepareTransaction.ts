import { getTokenById } from "@ledgerhq/cryptoassets";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { findSubAccountById } from "../../account";
import type { Account } from "@ledgerhq/types-live";
import { ChainAPI } from "./api";
import {
  getMaybeTokenAccount,
  getMaybeVoteAccount,
  getStakeAccountAddressWithSeed,
  getStakeAccountMinimumBalanceForRentExemption,
} from "./api/chain/web3";
import {
  SolanaAccountNotFunded,
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
} from "./errors";
import {
  decodeAccountIdWithTokenAccountAddress,
  isEd25519Address,
  isValidBase58Address,
  MAX_MEMO_LENGTH,
} from "./logic";
import type {
  CommandDescriptor,
  SolanaAccount,
  SolanaStake,
  StakeCreateAccountTransaction,
  StakeDelegateTransaction,
  StakeSplitTransaction,
  StakeUndelegateTransaction,
  StakeWithdrawTransaction,
  TokenCreateATATransaction,
  TokenRecipientDescriptor,
  TokenTransferTransaction,
  Transaction,
  TransactionModel,
  TransferCommand,
  TransferTransaction,
} from "./types";
import { assertUnreachable } from "./utils";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { estimateFeeAndSpendable } from "./js-estimateMaxSpendable";

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
    default:
      return assertUnreachable(model);
  }
}

const prepareTransaction = async (
  mainAccount: SolanaAccount,
  tx: Transaction,
  api: ChainAPI,
): Promise<Transaction> => {
  const txToDeriveFrom = updateModelIfSubAccountIdPresent(tx);

  const commandDescriptor = await deriveCommandDescriptor(mainAccount, txToDeriveFrom, api);

  const model: TransactionModel = {
    ...tx.model,
    commandDescriptor,
  };

  const patch: Partial<Transaction> = {
    model,
  };

  return defaultUpdateTransaction(tx, patch);
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

  await validateRecipientCommon(mainAccount, tx, errors, warnings, api);

  const memo = model.uiState.memo;

  if (typeof memo === "string" && memo.length > 0) {
    validateMemoCommon(memo, errors);
  }

  const tokenIdParts = subAccount.token.id.split("/");
  const mintAddress = tokenIdParts[tokenIdParts.length - 1];
  const mintDecimals = subAccount.token.units[0].magnitude;

  const senderAssociatedTokenAccountAddress = decodeAccountIdWithTokenAccountAddress(
    subAccount.id,
  ).address;

  if (!errors.recipient && tx.recipient === senderAssociatedTokenAccountAddress) {
    errors.recipient = new SolanaTokenRecipientIsSenderATA();
  }

  const defaultRecipientDescriptor: TokenRecipientDescriptor = {
    shouldCreateAsAssociatedTokenAccount: false,
    tokenAccAddress: "",
    walletAddress: "",
  };

  const recipientDescriptorOrError = errors.recipient
    ? defaultRecipientDescriptor
    : await getTokenRecipient(tx.recipient, mintAddress, api);

  if (!errors.recipient && recipientDescriptorOrError instanceof Error) {
    errors.recipient = recipientDescriptorOrError;
  }

  const recipientDescriptor: TokenRecipientDescriptor =
    recipientDescriptorOrError instanceof Error
      ? defaultRecipientDescriptor
      : recipientDescriptorOrError;

  const assocAccRentExempt = recipientDescriptor.shouldCreateAsAssociatedTokenAccount
    ? await api.getAssocTokenAccMinNativeBalance()
    : 0;

  if (recipientDescriptor.shouldCreateAsAssociatedTokenAccount) {
    warnings.recipient = new SolanaRecipientAssociatedTokenAccountWillBeFunded();
  }

  const { fee, spendable: spendableSol } = await estimateFeeAndSpendable(api, mainAccount, tx);

  if (spendableSol.lt(assocAccRentExempt)) {
    errors.fee = new NotEnoughBalance();
  }

  if (!tx.useAllAmount && tx.amount.lte(0)) {
    errors.amount = new AmountRequired();
  }

  const txAmount = tx.useAllAmount ? subAccount.spendableBalance.toNumber() : tx.amount.toNumber();

  if (!errors.amount && txAmount > subAccount.spendableBalance.toNumber()) {
    errors.amount = new NotEnoughBalance();
  }

  return {
    command: {
      kind: "token.transfer",
      ownerAddress: mainAccount.freshAddress,
      ownerAssociatedTokenAccountAddress: senderAssociatedTokenAccountAddress,
      amount: txAmount,
      mintAddress,
      mintDecimals,
      recipientDescriptor: recipientDescriptor,
      memo: model.uiState.memo,
    },
    fee: fee + assocAccRentExempt,
    warnings,
    errors,
  };
};

async function getTokenRecipient(
  recipientAddress: string,
  mintAddress: string,
  api: ChainAPI,
): Promise<TokenRecipientDescriptor | Error> {
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
    );

    const shouldCreateAsAssociatedTokenAccount = !(await isAccountFunded(
      recipientAssociatedTokenAccountAddress,
      api,
    ));

    return {
      walletAddress: recipientAddress,
      shouldCreateAsAssociatedTokenAccount,
      tokenAccAddress: recipientAssociatedTokenAccountAddress,
    };
  } else {
    if (recipientTokenAccount.mint.toBase58() !== mintAddress) {
      return new SolanaTokenAccountHoldsAnotherToken();
    }
    if (recipientTokenAccount.state !== "initialized") {
      return new SolanaTokenAccounNotInitialized();
    }
  }

  return {
    walletAddress: recipientTokenAccount.owner.toBase58(),
    shouldCreateAsAssociatedTokenAccount: false,
    tokenAccAddress: recipientAddress,
  };
}

async function deriveCreateAssociatedTokenAccountCommandDescriptor(
  mainAccount: Account,
  tx: Transaction,
  model: TransactionModel & { kind: TokenCreateATATransaction["kind"] },
  api: ChainAPI,
): Promise<CommandDescriptor> {
  const errors: Record<string, Error> = {};

  const token = getTokenById(model.uiState.tokenId);
  const tokenIdParts = token.id.split("/");
  const mint = tokenIdParts[tokenIdParts.length - 1];

  const associatedTokenAccountAddress = await api.findAssocTokenAccAddress(
    mainAccount.freshAddress,
    mint,
  );

  const { fee } = await estimateFeeAndSpendable(api, mainAccount, tx);

  if (mainAccount.spendableBalance.lt(fee)) {
    errors.fee = new NotEnoughBalance();
  }

  return {
    fee,
    command: {
      kind: model.kind,
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

  await validateRecipientCommon(mainAccount, tx, errors, warnings, api);

  const memo = model.uiState.memo;

  if (typeof memo === "string" && memo.length > 0) {
    validateMemoCommon(memo, errors);
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

async function deriveStakeCreateAccountCommandDescriptor(
  mainAccount: Account,
  tx: Transaction,
  model: TransactionModel & { kind: StakeCreateAccountTransaction["kind"] },
  api: ChainAPI,
): Promise<CommandDescriptor> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

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

  if (mainAccount.spendableBalance.lt(fee)) {
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

  if (mainAccount.spendableBalance.lt(fee)) {
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
  if (tx.subAccountId) {
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

    if (recipientWalletIsUnfunded) {
      warnings.recipient = new SolanaAccountNotFunded();
    }
    if (!isEd25519Address(tx.recipient)) {
      warnings.recipientOffCurve = new SolanaAddressOffEd25519();
    }
  }
}

function validateMemoCommon(memo: string, errors: Record<string, Error>) {
  const memoBytes = Buffer.from(memo, "utf-8");
  if (memoBytes.byteLength > MAX_MEMO_LENGTH) {
    errors.memo = errors.memo = new SolanaMemoIsTooLong(undefined, {
      maxLength: MAX_MEMO_LENGTH,
    });
    // LLM expects <transaction> as error key to disable continue button
    errors.transaction = errors.memo;
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

export { prepareTransaction };
