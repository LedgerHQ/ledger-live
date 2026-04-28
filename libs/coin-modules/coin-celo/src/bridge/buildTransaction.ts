import { findSubAccountById } from "@ledgerhq/ledger-wallet-framework/account/index";
import { BigNumber } from "bignumber.js";
import { encodeFunctionData } from "viem";
import {
  CELO_STABLE_TOKENS,
  getStableTokenRegistryName,
  MAX_FEES_THRESHOLD_MULTIPLIER,
} from "../constants";
import { getPendingStakingOperationAmounts, getVote } from "../logic";
import { getCeloClient } from "../network/client";
import { ACCOUNTS_ABI, ELECTION_ABI, ERC20_ABI, LOCKED_GOLD_ABI } from "../network/abis";
import { getRegistryAddressFor } from "../network/registry";
import { voteSignerAccount } from "../network/sdk";
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
  const [groups, votes] = await client.readContract({
    address: electionAddress,
    abi: ELECTION_ABI,
    functionName: "getEligibleValidatorGroupsVotes",
  });

  const groupIdx = groups.findIndex(g => g.toLowerCase() === group.toLowerCase());
  const currentVotes = groupIdx >= 0 ? votes[groupIdx] : BigInt(0);
  const newVotes = add ? currentVotes + delta : currentVotes > delta ? currentVotes - delta : BigInt(0);

  const sorted: { address: `0x${string}`; votes: bigint }[] = groups
    .map((addr, i) => ({ address: addr, votes: i === groupIdx ? newVotes : votes[i] }))
    .sort((a, b) => (a.votes < b.votes ? -1 : a.votes > b.votes ? 1 : 0));

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;
  const idx = sorted.findIndex(g => g.address.toLowerCase() === group.toLowerCase());

  const lesser = idx > 0 ? sorted[idx - 1].address : ZERO_ADDRESS;
  const greater = idx < sorted.length - 1 ? sorted[idx + 1].address : ZERO_ADDRESS;

  return { lesser, greater };
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

const buildTransaction = async (
  account: CeloAccount,
  transaction: Transaction,
): Promise<CeloTransactionRequest> => {
  const client = getCeloClient();
  const tokenAccount = findSubAccountById(account, transaction.subAccountId || "");
  const isTokenTransaction = tokenAccount?.type === "TokenAccount";

  let value = transactionValue(account, transaction);
  let celoTransaction: CeloTransactionRequest;

  if (transaction.mode === "lock") {
    const lockedGoldAddress = await getRegistryAddressFor("LockedGold");
    const valueHex = valueToHex(value);
    const data = encodeFunctionData({ abi: LOCKED_GOLD_ABI, functionName: "lock" });
    const gas = await client.estimateGas({
      account: account.freshAddress as `0x${string}`,
      to: lockedGoldAddress,
      data,
      value: BigInt(valueHex),
    });
    celoTransaction = {
      from: account.freshAddress as `0x${string}`,
      value: valueHex,
      to: lockedGoldAddress,
      data,
      gas: Number(gas),
    };
  } else if (transaction.mode === "unlock") {
    const lockedGoldAddress = await getRegistryAddressFor("LockedGold");
    const data = encodeFunctionData({
      abi: LOCKED_GOLD_ABI,
      functionName: "unlock",
      args: [BigInt(value.toFixed())],
    });
    const gas = await client.estimateGas({
      account: account.freshAddress as `0x${string}`,
      to: lockedGoldAddress,
      data,
    });
    celoTransaction = {
      from: account.freshAddress as `0x${string}`,
      to: lockedGoldAddress,
      data,
      gas: Number(gas),
    };
  } else if (transaction.mode === "withdraw") {
    const lockedGoldAddress = await getRegistryAddressFor("LockedGold");
    const withdrawIndex = transaction.index || 0;
    const data = encodeFunctionData({
      abi: LOCKED_GOLD_ABI,
      functionName: "withdraw",
      args: [BigInt(withdrawIndex)],
    });
    const gas = await client.estimateGas({
      account: account.freshAddress as `0x${string}`,
      to: lockedGoldAddress,
      data,
      value: BigInt(valueToHex(value)),
    });
    celoTransaction = {
      from: account.freshAddress as `0x${string}`,
      to: lockedGoldAddress,
      data,
      gas: Number(gas),
    };
  } else if (transaction.mode === "vote") {
    const electionAddress = await getRegistryAddressFor("Election");
    const { lesser, greater } = await getVoteNeighbors(
      electionAddress,
      transaction.recipient as `0x${string}`,
      BigInt(value.toFixed()),
      true,
    );
    const data = encodeFunctionData({
      abi: ELECTION_ABI,
      functionName: "vote",
      args: [transaction.recipient as `0x${string}`, BigInt(value.toFixed()), lesser, greater],
    });
    const gas = await client.estimateGas({
      account: account.freshAddress as `0x${string}`,
      to: electionAddress,
      data,
    });
    celoTransaction = {
      from: account.freshAddress as `0x${string}`,
      to: electionAddress,
      data,
      gas: Number(gas),
    };
  } else if (transaction.mode === "revoke") {
    const electionAddress = await getRegistryAddressFor("Election");
    const accountsAddress = await getRegistryAddressFor("Accounts");
    const signerAddress = await voteSignerAccount(account.freshAddress);

    const { lesser, greater } = await getVoteNeighbors(
      electionAddress,
      transaction.recipient as `0x${string}`,
      BigInt(value.toFixed()),
      false,
    );

    const isPending = transaction.index === 0;
    const groupIndex = 0; // First matching group index

    void accountsAddress;
    void signerAddress;

    const revokeArgs = [
      transaction.recipient as `0x${string}`,
      BigInt(value.toFixed()),
      lesser,
      greater,
      BigInt(groupIndex),
    ] as const;

    const data: `0x${string}` = isPending
      ? encodeFunctionData({ abi: ELECTION_ABI, functionName: "revokePending", args: revokeArgs })
      : encodeFunctionData({ abi: ELECTION_ABI, functionName: "revokeActive", args: revokeArgs });

    const gas = await client.estimateGas({
      account: account.freshAddress as `0x${string}`,
      to: electionAddress,
      data,
    });
    celoTransaction = {
      from: account.freshAddress as `0x${string}`,
      to: electionAddress,
      data,
      gas: Number(gas),
    };
  } else if (transaction.mode === "activate") {
    const electionAddress = await getRegistryAddressFor("Election");
    const data = encodeFunctionData({
      abi: ELECTION_ABI,
      functionName: "activate",
      args: [transaction.recipient as `0x${string}`],
    });
    const gas = await client.estimateGas({
      account: account.freshAddress as `0x${string}`,
      to: electionAddress,
      data,
    });
    celoTransaction = {
      from: account.freshAddress as `0x${string}`,
      to: electionAddress,
      data,
      gas: Number(gas),
    };
  } else if (transaction.mode === "register") {
    const accountsAddress = await getRegistryAddressFor("Accounts");
    const data = encodeFunctionData({ abi: ACCOUNTS_ABI, functionName: "createAccount" });
    const gas = await client.estimateGas({
      account: account.freshAddress as `0x${string}`,
      to: accountsAddress,
      data,
    });
    celoTransaction = {
      from: account.freshAddress as `0x${string}`,
      to: accountsAddress,
      data,
      gas: Number(gas),
    };
  } else if (isTokenTransaction) {
    value = calcTokenTransferValue(tokenAccount, transaction);

    const tokenAddress: `0x${string}` = CELO_STABLE_TOKENS.includes(tokenAccount.token.id)
      ? await getRegistryAddressFor(getStableTokenRegistryName(tokenAccount.token.id))
      : (tokenAccount.token.contractAddress as `0x${string}`);

    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [transaction.recipient as `0x${string}`, BigInt(value.toFixed())],
    });

    celoTransaction = {
      from: account.freshAddress as `0x${string}`,
      to: tokenAddress,
      data,
      value: valueToHex(value),
      ...(transaction.feeCurrency
        ? {
            feeCurrency: transaction.feeCurrency,
          }
        : {}),
    };
  } else {
    // Send native CELO
    celoTransaction = {
      from: account.freshAddress as `0x${string}`,
      to: transaction.recipient as `0x${string}`,
      value: valueToHex(value),
      ...(transaction.feeCurrency
        ? {
            feeCurrency: transaction.feeCurrency,
          }
        : {}),
    };
  }

  const estimatedGas = await client.estimateGas({
    account: celoTransaction.from,
    to: celoTransaction.to,
    data: celoTransaction.data,
    value: celoTransaction.value !== undefined ? BigInt(celoTransaction.value) : undefined,
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
