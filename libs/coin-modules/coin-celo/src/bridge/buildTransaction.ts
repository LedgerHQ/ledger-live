import { accountsABI, electionABI, ierc20ABI, lockedGoldABI } from "@celo/abis";
import { findSubAccountById } from "@ledgerhq/ledger-wallet-framework/account/index";
import { BigNumber } from "bignumber.js";
import { encodeFunctionData } from "viem";
import {
  CELO_STABLE_TOKENS,
  getStableTokenRegistryName,
  MAX_FEES_THRESHOLD_MULTIPLIER,
  ZERO_ADDRESS,
} from "../constants";
import { getPendingStakingOperationAmounts, getVote } from "../logic";
import { getCeloClient } from "../network/client";
import { getRegistryAddressFor } from "../network/registry";
import type { CeloAccount, CeloTransactionRequest, Transaction } from "../types";
import { valueToHex, isSameTokenAsFee, normalizeAndSubtract, convertNumberDecimals } from "./utils";

/**
 * Find lesser/greater neighbor groups for Celo Election vote/revoke operations.
 * Returns the addresses that come just below and above the target group by total votes.
 */
const getVoteNeighbors = async (
  electionAddress: `0x${string}`,
  group: `0x${string}`,
  delta: bigint,
  add: boolean,
): Promise<{ lesser: `0x${string}`; greater: `0x${string}` }> => {
  const client = getCeloClient();
  // On networks where no validator groups are registered (e.g. some testnets)
  // the call may revert. Treat that as an empty list so lesser/greater both
  // resolve to the zero address.
  let groups: readonly `0x${string}`[] = [];
  let votes: readonly bigint[] = [];
  try {
    [groups, votes] = await client.readContract({
      address: electionAddress,
      abi: electionABI,
      functionName: "getTotalVotesForEligibleValidatorGroups",
    });
  } catch {
    // empty eligible list — keep defaults
  }

  const groupIdx = groups.findIndex(g => g.toLowerCase() === group.toLowerCase());
  const currentVotes = groupIdx >= 0 ? votes[groupIdx] : BigInt(0);
  const newVotes = computeUpdatedVotes(currentVotes, delta, add);

  // Always include the target group in the sorted list. When groupIdx === -1 the
  // group is not yet in the eligible set (first-time voter), so we insert it
  // explicitly. Without this the group is missing from `sorted`, idx stays -1,
  // and lesser/greater are always wrong — causing the Election contract to revert.
  const normalizedGroup = group.toLowerCase();
  const otherGroups: { address: `0x${string}`; votes: bigint }[] = groups.reduce(
    (acc, addr, index) => {
      if (addr.toLowerCase() !== normalizedGroup) {
        acc.push({ address: addr, votes: votes[index] });
      }
      return acc;
    },
    [] as { address: `0x${string}`; votes: bigint }[],
  );

  const sorted: { address: `0x${string}`; votes: bigint }[] = [
    ...otherGroups,
    { address: group, votes: newVotes },
  ].sort(compareVotesAscending);

  const idx = sorted.findIndex(g => g.address.toLowerCase() === group.toLowerCase());

  const lesser = idx > 0 ? sorted[idx - 1].address : ZERO_ADDRESS;
  const greater = idx < sorted.length - 1 ? sorted[idx + 1].address : ZERO_ADDRESS;

  return { lesser, greater };
};

const computeUpdatedVotes = (currentVotes: bigint, delta: bigint, add: boolean): bigint => {
  if (add) return currentVotes + delta;
  if (currentVotes > delta) return currentVotes - delta;
  return BigInt(0);
};

const compareVotesAscending = (a: { votes: bigint }, b: { votes: bigint }): number => {
  if (a.votes < b.votes) return -1;
  if (a.votes > b.votes) return 1;
  return 0;
};

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

const buildRevokeTx = async (
  account: CeloAccount,
  transaction: Transaction,
  value: BigNumber,
): Promise<CeloTransactionRequest> => {
  const electionAddress = await getRegistryAddressFor("Election");
  const recipient = transaction.recipient as `0x${string}`;
  const revokeValue = BigInt(value.toFixed());

  const { lesser, greater } = await getVoteNeighbors(
    electionAddress,
    recipient,
    revokeValue,
    false,
  );
  const revokeArgs = [recipient, revokeValue, lesser, greater, BigInt(0)] as const;
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

  const valueAsBigInt =
    celoTransaction.value === undefined ? undefined : BigInt(celoTransaction.value);
  const estimatedGas = await client.estimateGas({
    account: celoTransaction.from,
    to: celoTransaction.to,
    data: celoTransaction.data,
    value: valueAsBigInt,
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
