import type { TransactionWithId } from "@dfinity/ledger-icp";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { GetAccountShape } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { Account, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import { fetchBalance, fetchBlockHeight, fetchTxns } from "../../api";
import {
  dedupeRetypedOperations,
  normalizeEpochTimestamp,
  reassignOperationType,
} from "../../common-logic/utils";
import { ICP_FEES } from "../../consts";
import { deriveAddressFromPubkey, derivePrincipalFromPubkey } from "../../logic/crypto";
import { hashTransaction } from "../../logic/hashTransaction";
import {
  ICPAccount,
  ICPNeuron,
  InternetComputerOperation,
  InternetComputerOperationExtra,
} from "../../types";
import { NeuronsData } from "../../types/neuron";

export const getAccountShape: GetAccountShape<ICPAccount> = async info => {
  const { currency, derivationMode, rest = {}, initialAccount } = info;
  const publicKey = reconciliatePublicKey(rest.publicKey, initialAccount);
  invariant(publicKey, "publicKey is required");

  // deriving address from public key
  const address = await deriveAddressFromPubkey(publicKey);
  invariant(address, "address is required");

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: publicKey,
    derivationMode,
  });

  // log("debug", `Generation account shape for ${address}`);

  const blockHeight = await fetchBlockHeight();
  const balance = await fetchBalance(address);
  const txns = await fetchTxns(
    address,
    BigInt(blockHeight.toString()),
    initialAccount ? BigInt(initialAccount.blockHeight.toString()) : undefined,
  );

  // Neurons aren't fetched during background sync (that needs device signing). They're refreshed by
  // the device-signed list_neurons operation, whose result rides in operation.extra.neurons.
  //
  // Seeded with the account's own snapshot so the fold can only move forward: an account persisted
  // before governance ops stopped entering history may still hold one, older than what it carries.
  const previous = initialAccount?.neurons;
  const latestSnapshot = [
    ...(initialAccount?.pendingOperations ?? []),
    ...(initialAccount?.operations ?? []),
  ].reduce<{ neurons: ICPNeuron[]; date: number }>(
    (latest, op) => {
      const snapshot = (op.extra as InternetComputerOperationExtra | undefined)?.neurons;
      return snapshot && op.date.getTime() > latest.date
        ? { neurons: snapshot, date: op.date.getTime() }
        : latest;
    },
    {
      neurons: previous?.fullNeurons ?? [],
      date: previous?.lastUpdatedMSecs ?? 0,
    },
  );
  const neurons = new NeuronsData(latestSnapshot.neurons, latestSnapshot.date);

  const neuronAddresses = neurons.fullNeurons.map(n => n.accountIdentifier);

  const result: Partial<ICPAccount> = {
    id: accountId,
    balance,
    spendableBalance: balance,
    operations: reassignOperationType(
      flatMap<TransactionWithId, InternetComputerOperation>(txns, mapTxToOps(accountId, address)),
      neuronAddresses,
      // Lets a stake be recognized from its own memo, so a settled staking transfer is not relabelled
      // a plain send for as long as the snapshot is empty.
      derivePrincipalFromPubkey(publicKey),
    ),
    blockHeight: blockHeight.toNumber(),
    // `operationsCount` is deliberately absent: the framework derives it from the merged list when
    // the shape omits it. Adding the fetched page to the stored count double-counted, because the
    // index canister is queried from the current ledger tip every time and so returns the newest
    // page again on every sync — the figure climbed without bound instead of tracking the account.
    xpub: publicKey,
    neurons,
  };

  return result;
};

/**
 * `getAccountShape` only ever retypes the page it just fetched; the stale `OUT` copy of a transfer
 * lives in the stored list, which the framework merges in afterwards. So the collapse has to run
 * once more on the merged result — this is also the pass that heals an account already holding
 * duplicates, since `mergeOps` never dedups the stored list against itself.
 */
export const postSync = (_initial: ICPAccount, synced: ICPAccount): ICPAccount => {
  const operations = dedupeRetypedOperations(synced.operations as InternetComputerOperation[]);
  // Same object unless something was actually dropped: a new one every sync would invalidate every
  // consumer memoized on `operations`. `operationsCount` follows, since the framework counted the
  // merged list before this pass thinned it.
  return operations.length === synced.operations.length
    ? synced
    : { ...synced, operations, operationsCount: operations.length };
};

function reconciliatePublicKey(publicKey?: string, initialAccount?: Account): string {
  if (publicKey) return publicKey;
  if (initialAccount) {
    const { xpubOrAddress } = decodeAccountId(initialAccount.id);
    return xpubOrAddress;
  }
  throw new Error("publicKey wasn't properly restored");
}

const mapTxToOps = (accountId: string, address: string, fee = ICP_FEES) => {
  return (txInfo: TransactionWithId): InternetComputerOperation[] => {
    const { transaction: txn } = txInfo;
    const ops: InternetComputerOperation[] = [];

    if (txn.operation === undefined) {
      return [];
    }

    if ("Transfer" in txn.operation === undefined) {
      return [];
    }

    const timeStamp = txn.timestamp[0]?.timestamp_nanos ?? Date.now();
    let amount = BigNumber(0);
    let fromAccount = "";
    let toAccount = "";
    let hash = "";
    if ("Transfer" in txn.operation) {
      amount = BigNumber(txn.operation.Transfer.amount.e8s.toString());
      fromAccount = txn.operation.Transfer.from;
      toAccount = txn.operation.Transfer.to;
      hash = hashTransaction({
        from: fromAccount,
        to: toAccount,
        amount: txn.operation.Transfer.amount.e8s,
        fee: txn.operation.Transfer.fee.e8s,
        memo: txn.memo,
        created_at_time: txn.created_at_time[0]?.timestamp_nanos ?? BigInt(0),
      });
    }

    const blockHeight = Number(txInfo.id);
    const blockHash = "";

    const memo = txInfo.transaction.memo.toString();

    const date = new Date(normalizeEpochTimestamp(timeStamp.toString()));
    const value = amount.abs();
    const feeToUse = BigNumber(fee);

    const isSending = address === fromAccount;
    const isReceiving = address === toAccount;

    let type: OperationType;
    if (isSending) {
      type = "OUT";
    } else {
      type = "IN";
    }

    if (isSending) {
      ops.push({
        id: encodeOperationId(accountId, hash, type),
        hash,
        type,
        value: value.plus(feeToUse),
        fee: feeToUse,
        blockHeight,
        blockHash,
        accountId,
        senders: [fromAccount],
        recipients: [toAccount],
        date,
        extra: {
          memo,
        },
      });
    }

    if (isReceiving) {
      ops.push({
        id: encodeOperationId(accountId, hash, type),
        hash,
        type,
        value,
        fee: feeToUse,
        blockHeight,
        blockHash,
        accountId,
        senders: [fromAccount],
        recipients: [toAccount],
        date,
        extra: {
          memo,
        },
      });
    }

    return ops;
  };
};
