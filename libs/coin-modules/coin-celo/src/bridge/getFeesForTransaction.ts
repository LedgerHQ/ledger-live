import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import { BigNumber } from "bignumber.js";
import type { CeloAccount, RevokeTxo, Transaction } from "../types";
import { celoKit } from "../network/sdk";
import { getPendingStakingOperationAmounts, getVote } from "../logic";
import buildTransaction from "./buildTransaction";
import {
  CELO_STABLE_TOKENS,
  getStableTokenEnum,
  MAX_FEES_THRESHOLD_MULTIPLIER,
  MIN_GAS_FOR_NATIVE_TRANSFER,
} from "../constants";
import { valueToHex } from "./utils";

const getFeesForTransaction = async ({
  account,
  transaction,
}: {
  account: CeloAccount;
  transaction: Transaction;
}): Promise<BigNumber> => {
  const { amount, index } = transaction;
  const kit = celoKit();

  // A workaround - estimating gas throws an error if value > funds
  let value: BigNumber = new BigNumber(0);

  const pendingOperationAmounts = getPendingStakingOperationAmounts(account);
  const lockedGold = await kit.contracts.getLockedGold();
  const nonvotingLockedGoldBalance = await lockedGold.getAccountNonvotingLockedGold(
    account.freshAddress,
  );
  // Deduct pending vote operations from the non-voting locked balance
  const totalNonVotingLockedBalance = nonvotingLockedGoldBalance.minus(
    pendingOperationAmounts.vote,
  );
  // Deduct pending lock operations from the spendable balance
  const totalSpendableBalance = account.spendableBalance.minus(pendingOperationAmounts.lock);

  const tokenAccount = findSubAccountById(account, transaction.subAccountId || "");
  const isTokenTransaction = tokenAccount?.type === "TokenAccount";
  const maxPriorityFeePerGas = await kit.connection.getMaxPriorityFeePerGas();

  // Align with @celo/connect setFeeMarketGas: used for final fee for all modes.
  const gasPrice = await kit.connection.gasPrice();
  const maxFeePerGas =
    ((BigInt(gasPrice) - BigInt(maxPriorityFeePerGas)) * BigInt(120)) / BigInt(100) +
    BigInt(maxPriorityFeePerGas);
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
    gas = await lockedGold
      .lock()
      .txo.estimateGas({ from: account.freshAddress, value: valueToHex(value) });
  } else if (transaction.mode === "unlock") {
    const lockedGold = await kit.contracts.getLockedGold();

    gas = await lockedGold.unlock(value).txo.estimateGas({ from: account.freshAddress });
  } else if (transaction.mode === "withdraw") {
    const lockedGold = await kit.contracts.getLockedGold();

    gas = await lockedGold.withdraw(index || 0).txo.estimateGas({ from: account.freshAddress });
  } else if (transaction.mode === "vote") {
    const election = await kit.contracts.getElection();

    const vote = await election.vote(transaction.recipient, new BigNumber(value));

    gas = await vote.txo.estimateGas({ from: account.freshAddress });
  } else if (transaction.mode === "revoke") {
    const election = await kit.contracts.getElection();
    const accounts = await kit.contracts.getAccounts();
    const voteSignerAccount = await accounts.voteSignerToAccount(account.freshAddress);
    const revokeTxs = await election.revoke(
      voteSignerAccount,
      transaction.recipient,
      new BigNumber(value),
    );

    const revokeTx = revokeTxs.find(transactionObject => {
      return (
        (transactionObject.txo as unknown as RevokeTxo)._method.name ===
        (transaction.index === 0 ? "revokePending" : "revokeActive")
      );
    });
    if (!revokeTx) return new BigNumber(0);

    gas = await revokeTx.txo.estimateGas({ from: account.freshAddress });
  } else if (transaction.mode === "activate") {
    const election = await kit.contracts.getElection();
    const accounts = await kit.contracts.getAccounts();
    const voteSignerAccount = await accounts.voteSignerToAccount(account.freshAddress);

    const activates = await election.activate(voteSignerAccount);

    const activate = activates.find(a => a.txo.arguments[0] === transaction.recipient);
    if (!activate) return new BigNumber(0);

    gas = await activate.txo.estimateGas({ from: account.freshAddress });
  } else if (transaction.mode === "register") {
    const accounts = await kit.contracts.getAccounts();

    gas = await accounts.createAccount().txo.estimateGas({ from: account.freshAddress });
  } else if (isTokenTransaction) {
    value = transaction.useAllAmount ? tokenAccount.balance : transaction.amount;

    const block = await kit.connection.web3.eth.getBlock("latest");
    const baseFee = BigInt(block.baseFeePerGas || maxPriorityFeePerGas);
    const maxFeePerGas = baseFee + BigInt(maxPriorityFeePerGas);

    let token;
    if (CELO_STABLE_TOKENS.includes(tokenAccount.token.id)) {
      token = await kit.contracts.getStableToken(getStableTokenEnum(tokenAccount.token.id));
    } else {
      token = await kit.contracts.getErc20(tokenAccount.token.contractAddress);
    }

    const celoTransaction = {
      from: account.freshAddress,
      to: transaction.recipient,
      data: token.transfer(transaction.recipient, value.toFixed()).txo.encodeABI(),
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas,
      value: valueToHex(value),
    };

    gas = Number(
      (
        (await kit.connection.estimateGasWithInflationFactor(celoTransaction)) *
        MAX_FEES_THRESHOLD_MULTIPLIER
      ).toFixed(),
    );
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
