import type { Transaction } from "./types";
import type { Account } from "../../types";
import { CeloTx } from "@celo/connect";
import { celoKit } from "./api/sdk";
import { BigNumber } from "bignumber.js";
import { getVote } from "./logic";

// TODO: a lot of this code overlaps with getFeesForTransaction, but not all. Check if passing an extracted
// celoTransaction from here to getFees estimateGas would work
const buildTransaction = async (account: Account, transaction: Transaction) => {
  const kit = celoKit();

  //TODO: reuse
  const value = transactionValue(account, transaction);

  let celoTransaction: CeloTx;

  if (transaction.mode === "lock") {
    const lockedGold = await kit.contracts.getLockedGold();
    celoTransaction = {
      from: account.freshAddress,
      value: value.toFixed(),
      to: lockedGold.address,
      data: lockedGold.lock().txo.encodeABI(),
    };
  } else if (transaction.mode === "unlock") {
    const lockedGold = await kit.contracts.getLockedGold();
    celoTransaction = {
      from: account.freshAddress,
      to: lockedGold.address,
      data: lockedGold.unlock(value).txo.encodeABI(),
    };
  } else if (transaction.mode === "withdraw") {
    const lockedGold = await kit.contracts.getLockedGold();

    celoTransaction = {
      from: account.freshAddress,
      to: lockedGold.address,
      data: lockedGold.withdraw(transaction.index || 0).txo.encodeABI(),
    };
  } else if (transaction.mode === "vote") {
    const election = await kit.contracts.getElection();
    const vote = await election.vote(
      transaction.recipient,
      new BigNumber(value)
    );

    celoTransaction = {
      from: account.freshAddress,
      to: election.address,
      data: vote.txo.encodeABI(),
    };
  } else if (transaction.mode === "revoke") {
    const election = await kit.contracts.getElection();
    const accounts = await kit.contracts.getAccounts();
    const voteSignerAccount = await accounts.voteSignerToAccount(
      account.freshAddress
    );

    const revokes = await election.revoke(
      voteSignerAccount,
      transaction.recipient,
      new BigNumber(value)
    );

    // TODO: refactor, extract?
    const revoke = revokes.find((transactionObject) => {
      return (
        (transactionObject.txo as any)._method.name ===
        (transaction.index === 0 ? "revokePending" : "revokeActive")
      );
    });
    if (!revoke) throw new Error("No votes to revoke");

    celoTransaction = {
      from: account.freshAddress,
      to: election.address,
      data: revoke.txo.encodeABI(),
    };
  } else if (transaction.mode === "activate") {
    const election = await kit.contracts.getElection();
    const accounts = await kit.contracts.getAccounts();
    const voteSignerAccount = await accounts.voteSignerToAccount(
      account.freshAddress
    );

    const activates = await election.activate(voteSignerAccount);
    const activate = activates.find(
      (a) => a.txo.arguments[0] === transaction.recipient
    );
    if (!activate) throw new Error("No votes to activate");

    celoTransaction = {
      from: account.freshAddress,
      to: election.address,
      data: activate.txo.encodeABI(),
    };
  } else if (transaction.mode === "register") {
    const accounts = await kit.contracts.getAccounts();

    celoTransaction = {
      from: account.freshAddress,
      to: accounts.address,
      data: accounts.createAccount().txo.encodeABI(),
    };
  } else {
    // Send
    const celoToken = await kit.contracts.getGoldToken();
    celoTransaction = {
      from: account.freshAddress,
      to: celoToken.address,
      data: celoToken
        .transfer(transaction.recipient, value.toFixed())
        .txo.encodeABI(),
    };
  }

  return {
    ...celoTransaction,
    chainId: await kit.connection.chainId(),
    nonce: await kit.connection.nonce(account.freshAddress),
    gas: await kit.connection.estimateGasWithInflationFactor(celoTransaction),
    gasPrice: await kit.connection.gasPrice(),
  } as CeloTx;
};

const transactionValue = (
  account: Account,
  transaction: Transaction
): BigNumber => {
  let value = transaction.amount;

  if (transaction.useAllAmount) {
    if (
      (transaction.mode === "unlock" || transaction.mode === "vote") &&
      account.celoResources
    ) {
      value = account.celoResources.nonvotingLockedBalance;
    } else if (transaction.mode === "revoke" && account.celoResources) {
      const revoke = getVote(account, transaction.recipient, transaction.index);
      if (revoke?.amount) value = revoke.amount;
    } else {
      value = account.spendableBalance.minus(transaction.fees || 0);
    }
  }

  return value;
};

export default buildTransaction;
