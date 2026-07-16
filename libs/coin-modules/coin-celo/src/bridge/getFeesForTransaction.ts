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
import { getPendingStakingOperationAmounts } from "../logic";
import { celoEstimateGas, celoGasPrice, getCeloClient } from "../network/client";
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

  // Gas to assume when on-chain estimation reverts/fails, so the fee is never 0
  // (a 0 fee trips FeeNotLoaded and disables Continue).
  const fallbackGas = MIN_GAS_FOR_NATIVE_TRANSFER * MAX_FEES_THRESHOLD_MULTIPLIER;

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
  } else if (transaction.mode === "revoke") {
    // No-op: the revoke value is computed inside buildTransaction (see the revoke
    // branch below). Kept explicit so revoke doesn't fall into the spendable-balance
    // branch and compute a `value` that is never used.
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
      gas = fallbackGas;
    }
  } else if (transaction.mode === "revoke") {
    // Reuse buildTransaction so the fee estimate uses the SAME revoke call as the
    // real transaction — crucially the correct lesser/greater neighbors computed
    // by getVoteNeighbors, and the revoke value (when useAllAmount is set, falling
    // back to the entered amount if the vote can't be matched). Estimating with
    // placeholder zero-address neighbors or a 0 value reverts on-chain, which
    // previously returned a 0 fee and left the Continue button disabled.
    try {
      const tx = await buildTransaction(account, transaction);
      // buildTransaction returns gas as a string; "0" is truthy, so compare
      // numerically to ensure a 0 estimate still falls back instead of yielding a 0 fee.
      const estimatedGas = Number(tx.gas);
      gas = estimatedGas > 0 ? estimatedGas : fallbackGas;
    } catch {
      gas = fallbackGas;
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
      // Fall back to a minimum gas estimate rather than returning a 0 fee, which
      // would trip FeeNotLoaded and disable Continue with no explanation.
      gas = fallbackGas;
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

    const estimatedGas = await celoEstimateGas({
      from: account.freshAddress as `0x${string}`,
      to: tokenAddress,
      data,
      maxFeePerGas: tokenMaxFeePerGas,
      maxPriorityFeePerGas,
      ...(transaction.feeCurrency && { feeCurrency: transaction.feeCurrency }),
    });

    gas = Number(Math.ceil(Number(estimatedGas) * MAX_FEES_THRESHOLD_MULTIPLIER).toString());
  } else {
    // Send: use estimated gas, or fallback so prepareTransaction succeeds and user can edit amount.
    try {
      const tx = await buildTransaction(account, transaction);
      gas = tx.gas ? Number(tx.gas) : 0;
    } catch {
      gas = fallbackGas;
    }
  }

  return maxFeePerGasNumber.times(gas);
};

export default getFeesForTransaction;
