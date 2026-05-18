import { accountsABI, electionABI, ierc20ABI, lockedGoldABI } from "@celo/abis";
import { findSubAccountById } from "@ledgerhq/ledger-wallet-framework/account/index";
import { BigNumber } from "bignumber.js";
import { encodeFunctionData } from "viem";
import {
  CELO_STABLE_TOKENS,
  getStableTokenRegistryName,
  MAX_FEES_THRESHOLD_MULTIPLIER,
  MIN_GAS_FOR_NATIVE_TRANSFER,
  ZERO_ADDRESS,
} from "../constants";
import { getPendingStakingOperationAmounts, getVote } from "../logic";
import { celoGasPrice, getCeloClient } from "../network/client";
import { getRegistryAddressFor } from "../network/registry";
import type { CeloAccount, Transaction } from "../types";
import buildTransaction from "./buildTransaction";
import { valueToHex } from "./utils";

const getFeesForTransaction = async ({
  account,
  transaction,
}: {
  account: CeloAccount;
  transaction: Transaction;
}): Promise<BigNumber> => {
  const { amount, index } = transaction;
  const client = getCeloClient();

  // A workaround - estimating gas throws an error if value > funds
  let value: BigNumber = new BigNumber(0);

  const pendingOperationAmounts = getPendingStakingOperationAmounts(account);
  const lockedGoldAddress = await getRegistryAddressFor("LockedGold");

  const nonvotingLockedGoldBalance = new BigNumber(
    (
      await client.readContract({
        address: lockedGoldAddress,
        abi: lockedGoldABI,
        functionName: "getAccountNonvotingLockedGold",
        args: [account.freshAddress as `0x${string}`],
      })
    ).toString(),
  );

  // Deduct pending vote operations from the non-voting locked balance
  const totalNonVotingLockedBalance = nonvotingLockedGoldBalance.minus(
    pendingOperationAmounts.vote,
  );
  // Deduct pending lock operations from the spendable balance
  const totalSpendableBalance = account.spendableBalance.minus(pendingOperationAmounts.lock);

  const tokenAccount = findSubAccountById(account, transaction.subAccountId || "");
  const isTokenTransaction = tokenAccount?.type === "TokenAccount";

  const maxPriorityFeePerGas = BigInt(await client.estimateMaxPriorityFeePerGas());
  // Align with @celo/connect setFeeMarketGas: used for final fee for all modes.
  const gasPrice = await celoGasPrice(transaction.feeCurrency ?? undefined);
  const baseFeePerGas =
    gasPrice > maxPriorityFeePerGas ? gasPrice - maxPriorityFeePerGas : BigInt(0);
  const maxFeePerGas = (baseFeePerGas * BigInt(120)) / BigInt(100) + maxPriorityFeePerGas;
  const maxFeePerGasNumber = new BigNumber(maxFeePerGas.toString());

  if ((transaction.mode === "unlock" || transaction.mode === "vote") && account.celoResources) {
    value = transaction.useAllAmount
      ? totalNonVotingLockedBalance
      : BigNumber.minimum(amount, totalNonVotingLockedBalance);
  } else if (transaction.mode === "revoke" && account.celoResources) {
    const vote = getVote(account, transaction.recipient, transaction.index);
    if (vote) {
      value = transaction.useAllAmount ? vote.amount : BigNumber.minimum(amount, vote.amount);
    }
  } else {
    value = transaction.useAllAmount
      ? totalSpendableBalance
      : BigNumber.minimum(amount, totalSpendableBalance);
  }

  let gas: number | null = null;

  if (transaction.mode === "lock") {
    const data = encodeFunctionData({ abi: lockedGoldABI, functionName: "lock" });
    gas = Number(
      await client.estimateGas({
        account: account.freshAddress as `0x${string}`,
        to: lockedGoldAddress,
        data,
        value: BigInt(valueToHex(value)),
      }),
    );
  } else if (transaction.mode === "unlock") {
    const data = encodeFunctionData({
      abi: lockedGoldABI,
      functionName: "unlock",
      args: [BigInt(value.toFixed())],
    });
    gas = Number(
      await client.estimateGas({
        account: account.freshAddress as `0x${string}`,
        to: lockedGoldAddress,
        data,
      }),
    );
  } else if (transaction.mode === "withdraw") {
    const data = encodeFunctionData({
      abi: lockedGoldABI,
      functionName: "withdraw",
      args: [BigInt(index || 0)],
    });
    gas = Number(
      await client.estimateGas({
        account: account.freshAddress as `0x${string}`,
        to: lockedGoldAddress,
        data,
      }),
    );
  } else if (transaction.mode === "vote") {
    const electionAddress = await getRegistryAddressFor("Election");
    const data = encodeFunctionData({
      abi: electionABI,
      functionName: "vote",
      args: [
        transaction.recipient as `0x${string}`,
        BigInt(value.toFixed()),
        ZERO_ADDRESS,
        ZERO_ADDRESS,
      ],
    });
    try {
      gas = Number(
        await client.estimateGas({
          account: account.freshAddress as `0x${string}`,
          to: electionAddress,
          data,
        }),
      );
    } catch {
      gas = MIN_GAS_FOR_NATIVE_TRANSFER * MAX_FEES_THRESHOLD_MULTIPLIER;
    }
  } else if (transaction.mode === "revoke") {
    const electionAddress = await getRegistryAddressFor("Election");
    const isPending = transaction.index === 0;
    const revokeArgs = [
      transaction.recipient as `0x${string}`,
      BigInt(value.toFixed()),
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      BigInt(0),
    ] as const;
    const data = isPending
      ? encodeFunctionData({ abi: electionABI, functionName: "revokePending", args: revokeArgs })
      : encodeFunctionData({ abi: electionABI, functionName: "revokeActive", args: revokeArgs });

    try {
      gas = Number(
        await client.estimateGas({
          account: account.freshAddress as `0x${string}`,
          to: electionAddress,
          data,
        }),
      );
    } catch {
      return new BigNumber(0);
    }
  } else if (transaction.mode === "activate") {
    const electionAddress = await getRegistryAddressFor("Election");
    const data = encodeFunctionData({
      abi: electionABI,
      functionName: "activate",
      args: [transaction.recipient as `0x${string}`],
    });
    try {
      gas = Number(
        await client.estimateGas({
          account: account.freshAddress as `0x${string}`,
          to: electionAddress,
          data,
        }),
      );
    } catch {
      return new BigNumber(0);
    }
  } else if (transaction.mode === "register") {
    const accountsAddress = await getRegistryAddressFor("Accounts");
    const data = encodeFunctionData({ abi: accountsABI, functionName: "createAccount" });
    gas = Number(
      await client.estimateGas({
        account: account.freshAddress as `0x${string}`,
        to: accountsAddress,
        data,
      }),
    );
  } else if (isTokenTransaction) {
    value = transaction.useAllAmount ? tokenAccount.balance : transaction.amount;

    const block = await client.getBlock({ blockTag: "latest" });
    const baseFee = block.baseFeePerGas ?? maxPriorityFeePerGas;
    const tokenMaxFeePerGas = baseFee + maxPriorityFeePerGas;

    let tokenAddress: `0x${string}`;
    if (CELO_STABLE_TOKENS.includes(tokenAccount.token.id)) {
      tokenAddress = await getRegistryAddressFor(getStableTokenRegistryName(tokenAccount.token.id));
    } else {
      tokenAddress = tokenAccount.token.contractAddress as `0x${string}`;
    }

    const data = encodeFunctionData({
      abi: ierc20ABI,
      functionName: "transfer",
      args: [transaction.recipient as `0x${string}`, BigInt(value.toFixed())],
    });

    // Use eth_estimateGas directly so we can pass feeCurrency (viem's estimateGas doesn't expose it).
    const estimateParams: Record<string, string | undefined> = {
      from: account.freshAddress,
      to: tokenAddress,
      data,
      maxFeePerGas: `0x${tokenMaxFeePerGas.toString(16)}`,
      maxPriorityFeePerGas: `0x${maxPriorityFeePerGas.toString(16)}`,
    };
    if (transaction.feeCurrency) {
      estimateParams.feeCurrency = transaction.feeCurrency;
    }
    const estimatedGasHex = await client.request({
      method: "eth_estimateGas",
      params: [estimateParams],
    } as Parameters<typeof client.request>[0]);
    const estimatedGas = BigInt(estimatedGasHex as string);

    gas = Number(Math.ceil(Number(estimatedGas) * MAX_FEES_THRESHOLD_MULTIPLIER).toString());
  } else {
    // Send: use estimated gas, or fallback so prepareTransaction succeeds and user can edit amount.
    try {
      const tx = await buildTransaction(account, transaction);
      gas = tx.gas ? Number(tx.gas) : 0;
    } catch {
      gas = MIN_GAS_FOR_NATIVE_TRANSFER * MAX_FEES_THRESHOLD_MULTIPLIER;
    }
  }

  return maxFeePerGasNumber.times(gas);
};

export default getFeesForTransaction;
