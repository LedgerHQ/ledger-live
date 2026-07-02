import { accountsABI, electionABI, ierc20ABI, lockedGoldABI } from "@celo/abis";
import { findSubAccountById } from "@ledgerhq/ledger-wallet-framework/account/index";
import { BigNumber } from "bignumber.js";
import { encodeFunctionData } from "viem";
import {
  CELO_STABLE_TOKENS,
  getStableTokenRegistryName,
  MAX_FEES_THRESHOLD_MULTIPLIER,
} from "../constants";
import { CeloGroupNotVoted } from "../errors";
import { getPendingStakingOperationAmounts, getVote } from "../logic";
import { celoEstimateGas, getCeloClient } from "../network/client";
import { getRegistryAddressFor } from "../network/registry";
import { voteSignerAccount } from "../network/sdk";
import { getVoteNeighbors } from "../network/voteNeighbors";
import type { CeloAccount, CeloTransactionRequest, Transaction } from "../types";
import { valueToHex, isSameTokenAsFee, normalizeAndSubtract, convertNumberDecimals } from "./utils";

const calcTokenTransferValue = (
  tokenAccount: NonNullable<ReturnType<typeof findSubAccountById>> & { type: "TokenAccount" },
  transaction: Transaction,
): BigNumber => {
  if (!transaction.useAllAmount) return transaction.amount;

  const shouldSubtractFee = isSameTokenAsFee(
    true,
    tokenAccount.token.contractAddress,
    transaction.feeCurrencyUnwrapped,
  );

  if (shouldSubtractFee) {
    const balanceAfterFee = normalizeAndSubtract(
      tokenAccount.spendableBalance,
      transaction.fees,
      tokenAccount.token.units[0].magnitude,
    );
    return BigNumber.max(
      0,
      convertNumberDecimals(balanceAfterFee, tokenAccount.token.units[0].magnitude),
    );
  }

  return tokenAccount.spendableBalance;
};

type CeloTokenAccount = NonNullable<ReturnType<typeof findSubAccountById>> & {
  type: "TokenAccount";
};

const buildLockTx = async (
  account: CeloAccount,
  value: BigNumber,
): Promise<CeloTransactionRequest> => {
  const lockedGoldAddress = await getRegistryAddressFor("LockedGold");
  return {
    from: account.freshAddress as `0x${string}`,
    value: valueToHex(value),
    to: lockedGoldAddress,
    data: encodeFunctionData({ abi: lockedGoldABI, functionName: "lock" }),
  };
};

const buildUnlockTx = async (
  account: CeloAccount,
  value: BigNumber,
): Promise<CeloTransactionRequest> => {
  const lockedGoldAddress = await getRegistryAddressFor("LockedGold");
  return {
    from: account.freshAddress as `0x${string}`,
    to: lockedGoldAddress,
    data: encodeFunctionData({
      abi: lockedGoldABI,
      functionName: "unlock",
      args: [BigInt(value.toFixed())],
    }),
  };
};

const buildWithdrawTx = async (
  account: CeloAccount,
  transaction: Transaction,
): Promise<CeloTransactionRequest> => {
  const lockedGoldAddress = await getRegistryAddressFor("LockedGold");
  const withdrawIndex = transaction.index || 0;
  return {
    from: account.freshAddress as `0x${string}`,
    to: lockedGoldAddress,
    data: encodeFunctionData({
      abi: lockedGoldABI,
      functionName: "withdraw",
      args: [BigInt(withdrawIndex)],
    }),
  };
};

const buildVoteTx = async (
  client: ReturnType<typeof getCeloClient>,
  account: CeloAccount,
  transaction: Transaction,
  value: BigNumber,
): Promise<CeloTransactionRequest> => {
  const electionAddress = await getRegistryAddressFor("Election");
  const voteValue = BigInt(value.toFixed());
  const recipient = transaction.recipient as `0x${string}`;

  const canVote = await client.readContract({
    address: electionAddress,
    abi: electionABI,
    functionName: "canReceiveVotes",
    args: [recipient, voteValue],
  });

  if (!canVote) {
    throw new Error(
      `Validator group ${transaction.recipient} cannot receive more votes: vote cap exceeded`,
    );
  }

  const { lesser, greater } = await getVoteNeighbors(electionAddress, recipient, voteValue, true);
  return {
    from: account.freshAddress as `0x${string}`,
    to: electionAddress,
    data: encodeFunctionData({
      abi: electionABI,
      functionName: "vote",
      args: [recipient, voteValue, lesser, greater],
    }),
  };
};

/**
 * Resolve the index of `group` within the account's list of voted-for groups.
 *
 * Election.revokePending / revokeActive take this index as their 5th argument and
 * enforce `group == groupsVoted[index]`, reverting with "Bad index" otherwise. It
 * must NOT be confused with `transaction.index`, which this codebase uses only as a
 * pending(0)/active(1) marker. Hard-coding it to 0 breaks revoke for any account that
 * has voted for more than one group and revokes a non-first group.
 *
 * The vote-signer resolution mirrors `getVotes` in `network/sdk`, so the computed
 * index lines up with the same vote list shown in the UI (and thus the group the user
 * is revoking). The positional index isn't derivable from the preloaded
 * `celoResources.votes` (which store a pending/active marker, not the group's
 * position), so it's read on demand here.
 */
const getVotedGroupIndex = async (
  electionAddress: `0x${string}`,
  account: CeloAccount,
  group: `0x${string}`,
): Promise<bigint> => {
  const client = getCeloClient();
  const signerAddress = (await voteSignerAccount(account.freshAddress)) as `0x${string}`;
  const groupsVotedFor = await client.readContract({
    address: electionAddress,
    abi: electionABI,
    functionName: "getGroupsVotedForByAccount",
    args: [signerAddress],
  });

  const index = groupsVotedFor.findIndex(g => g.toLowerCase() === group.toLowerCase());
  if (index < 0) {
    throw new CeloGroupNotVoted(`celo: group ${group} not found in account's voted groups`);
  }
  return BigInt(index);
};

const buildRevokeTx = async (
  account: CeloAccount,
  transaction: Transaction,
  value: BigNumber,
): Promise<CeloTransactionRequest> => {
  const electionAddress = await getRegistryAddressFor("Election");
  const recipient = transaction.recipient as `0x${string}`;
  const revokeValue = BigInt(value.toFixed());

  const [{ lesser, greater }, groupIndex] = await Promise.all([
    getVoteNeighbors(electionAddress, recipient, revokeValue, false),
    getVotedGroupIndex(electionAddress, account, recipient),
  ]);
  const revokeArgs = [recipient, revokeValue, lesser, greater, groupIndex] as const;
  const functionName = transaction.index === 0 ? "revokePending" : "revokeActive";

  return {
    from: account.freshAddress as `0x${string}`,
    to: electionAddress,
    data: encodeFunctionData({ abi: electionABI, functionName, args: revokeArgs }),
  };
};

const buildActivateTx = async (
  account: CeloAccount,
  transaction: Transaction,
): Promise<CeloTransactionRequest> => {
  const electionAddress = await getRegistryAddressFor("Election");
  return {
    from: account.freshAddress as `0x${string}`,
    to: electionAddress,
    data: encodeFunctionData({
      abi: electionABI,
      functionName: "activate",
      args: [transaction.recipient as `0x${string}`],
    }),
  };
};

const buildRegisterTx = async (account: CeloAccount): Promise<CeloTransactionRequest> => {
  const accountsAddress = await getRegistryAddressFor("Accounts");
  return {
    from: account.freshAddress as `0x${string}`,
    to: accountsAddress,
    data: encodeFunctionData({ abi: accountsABI, functionName: "createAccount" }),
  };
};

const buildTokenTransferTx = async (
  account: CeloAccount,
  transaction: Transaction,
  tokenAccount: CeloTokenAccount,
  value: BigNumber,
): Promise<CeloTransactionRequest> => {
  const tokenAddress: `0x${string}` = CELO_STABLE_TOKENS.includes(tokenAccount.token.id)
    ? await getRegistryAddressFor(getStableTokenRegistryName(tokenAccount.token.id))
    : (tokenAccount.token.contractAddress as `0x${string}`);

  return {
    from: account.freshAddress as `0x${string}`,
    to: tokenAddress,
    data: encodeFunctionData({
      abi: ierc20ABI,
      functionName: "transfer",
      args: [transaction.recipient as `0x${string}`, BigInt(value.toFixed())],
    }),
    value: "0x0",
    ...(transaction.feeCurrency ? { feeCurrency: transaction.feeCurrency } : {}),
  };
};

const buildNativeSendTx = (
  account: CeloAccount,
  transaction: Transaction,
  value: BigNumber,
): CeloTransactionRequest => ({
  from: account.freshAddress as `0x${string}`,
  to: transaction.recipient as `0x${string}`,
  value: valueToHex(value),
  ...(transaction.feeCurrency ? { feeCurrency: transaction.feeCurrency } : {}),
});

const buildTransaction = async (
  account: CeloAccount,
  transaction: Transaction,
): Promise<CeloTransactionRequest> => {
  const client = getCeloClient();
  const tokenAccount = findSubAccountById(account, transaction.subAccountId || "");
  const isTokenTransaction = tokenAccount?.type === "TokenAccount";

  let value = transactionValue(account, transaction);
  let celoTransaction: CeloTransactionRequest;

  switch (transaction.mode) {
    case "lock":
      celoTransaction = await buildLockTx(account, value);
      break;
    case "unlock":
      celoTransaction = await buildUnlockTx(account, value);
      break;
    case "withdraw":
      celoTransaction = await buildWithdrawTx(account, transaction);
      break;
    case "vote":
      celoTransaction = await buildVoteTx(client, account, transaction, value);
      break;
    case "revoke":
      celoTransaction = await buildRevokeTx(account, transaction, value);
      break;
    case "activate":
      celoTransaction = await buildActivateTx(account, transaction);
      break;
    case "register":
      celoTransaction = await buildRegisterTx(account);
      break;
    case "send":
    default:
      if (isTokenTransaction) {
        value = calcTokenTransferValue(tokenAccount, transaction);
        celoTransaction = await buildTokenTransferTx(account, transaction, tokenAccount, value);
      } else {
        celoTransaction = buildNativeSendTx(account, transaction, value);
      }
      break;
  }

  const estimatedGas = await celoEstimateGas({
    from: celoTransaction.from,
    ...(celoTransaction.to !== undefined && { to: celoTransaction.to }),
    ...(celoTransaction.data !== undefined && { data: celoTransaction.data }),
    ...(celoTransaction.value !== undefined && { value: BigInt(celoTransaction.value) }),
    ...(celoTransaction.feeCurrency && { feeCurrency: celoTransaction.feeCurrency }),
  });

  const gas = Math.ceil(Number(estimatedGas) * MAX_FEES_THRESHOLD_MULTIPLIER).toString();
  const [chainId, nonce] = await Promise.all([
    client.getChainId(),
    client.getTransactionCount({ address: account.freshAddress as `0x${string}` }),
  ]);

  const tx: CeloTransactionRequest = {
    ...celoTransaction,
    gas,
    chainId,
    nonce,
  };

  return tx;
};

const calcUseAllSendValue = (account: CeloAccount, transaction: Transaction): BigNumber => {
  const shouldSubtractFee = isSameTokenAsFee(false, undefined, transaction.feeCurrencyUnwrapped);

  if (shouldSubtractFee) {
    return BigNumber.max(0, account.spendableBalance.minus(transaction.fees || 0));
  }

  return account.spendableBalance;
};

const calcUseAllTransactionValue = (account: CeloAccount, transaction: Transaction): BigNumber => {
  if ((transaction.mode === "unlock" || transaction.mode === "vote") && account.celoResources) {
    const pendingOperationAmounts = getPendingStakingOperationAmounts(account);
    const pendingOperationAmount =
      transaction.mode === "vote" ? pendingOperationAmounts.vote : new BigNumber(0);
    return account.celoResources.nonvotingLockedBalance.minus(pendingOperationAmount);
  }

  if (transaction.mode === "revoke" && account.celoResources) {
    const revoke = getVote(account, transaction.recipient, transaction.index);
    return revoke?.amount ?? transaction.amount;
  }

  return calcUseAllSendValue(account, transaction);
};

const transactionValue = (account: CeloAccount, transaction: Transaction): BigNumber => {
  if (!transaction.useAllAmount) return transaction.amount;
  return calcUseAllTransactionValue(account, transaction);
};

export default buildTransaction;
