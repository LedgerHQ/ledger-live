import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { fetchAccountBalance, fetchBlockHeight, fetchTransactions } from "./api/network";
import { Transfer } from "./api/types";
import { KadenaOperation } from "./types";
import { baseUnitToKda } from "./utils";

/**
 * Converts a public key to a Kadena address by prefixing it with 'k:'
 */
const getAddressFromPublicKey = (pubkey: string): string => {
  return `k:${pubkey}`;
};

interface CrossChainTransferParameters {
  senderAccount: string;
  receiverAccount: string;
  receiverChainId: number;
}

export const getAccountShape: GetAccountShape = async info => {
  const { initialAccount, currency, rest = {}, derivationMode } = info;
  // for bridge tests specifically the `rest` object is empty and therefore the publicKey is undefined
  // reconciliatePublicKey tries to get pubKey from rest object and then from accountId
  const pubKey = reconciliatePublicKey(rest.publicKey, initialAccount);
  invariant(pubKey, "publicKey is required");

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: pubKey,
    derivationMode,
  });

  const address = getAddressFromPublicKey(pubKey);

  const rawTxs = await fetchTransactions(address);

  const blockHeight = await fetchBlockHeight();

  const balance = await fetchAccountBalance(address);

  const result: Partial<Account> = {
    id: accountId,
    xpub: pubKey,
    freshAddress: address,
    balance: baseUnitToKda(balance),
    spendableBalance: baseUnitToKda(balance),
    operations: rawTxsToOps(rawTxs, accountId, address),
    blockHeight,
  };

  return result;
};

function reconciliatePublicKey(
  publicKey: string | undefined,
  initialAccount: Account | undefined,
): string {
  if (publicKey) return publicKey;
  if (initialAccount) {
    const { xpubOrAddress } = decodeAccountId(initialAccount.id);
    return xpubOrAddress;
  }
  throw new Error("publicKey wasn't properly restored");
}

const rawTxsToOps = (rawTxs: Transfer[], accountId: string, address: string): KadenaOperation[] => {
  const ops: KadenaOperation[] = [];
  const txs = new Map();

  // Gather ops from the same transaction
  for (const rawTx of rawTxs) {
    let tmp = [];

    if (rawTx.moduleName !== "coin") continue;

    if (txs.has(rawTx.requestKey)) {
      tmp = txs.get(rawTx.requestKey);
    }
    tmp.push(rawTx);

    txs.set(rawTx.requestKey, tmp);
  }

  // Build ops by taking index 0 as fee and index 1 as the actual transaction
  for (const tx of txs.values()) {
    const k_op: KadenaOperation = {} as KadenaOperation;
    k_op.fee = new BigNumber(0);
    k_op.value = new BigNumber(0);

    let transaction_op: Transfer | null = null;
    let fee_op: Transfer | null = null;

    // Find minimal amount value and
    for (const op of tx) {
      if (
        !transaction_op ||
        (transaction_op && new BigNumber(transaction_op.amount) < new BigNumber(op.amount))
      ) {
        transaction_op = op;
        fee_op = fee_op ? fee_op : transaction_op;
      } else {
        fee_op = op;
      }
    }

    if (transaction_op) {
      const {
        requestKey,
        block: { creationTime, height: blockHeight, hash: blockHash },
        amount,
        senderAccount,
        receiverAccount,
        chainId,
        crossChainTransfer,
        transaction: { result },
      } = transaction_op;
      const date = new Date(creationTime);
      const value = new BigNumber(amount);
      const fee = new BigNumber(fee_op?.amount ?? 0);
      const sender =
        senderAccount && senderAccount !== "" ? senderAccount : crossChainTransfer?.senderAccount;
      let recipient =
        receiverAccount && receiverAccount !== ""
          ? receiverAccount
          : crossChainTransfer?.receiverAccount;
      let receiverChainId = crossChainTransfer?.chainId ?? chainId;
      const isCrossChain =
        crossChainTransfer !== null || (crossChainTransfer === null && !recipient);
      const isFinished = Boolean(crossChainTransfer);
      const isSending = senderAccount === address;
      const type = isSending ? "OUT" : "IN";

      if (isCrossChain && !isFinished) {
        const crossChainTransferParameters = getCrossChainTransferStart(transaction_op);
        if (crossChainTransferParameters) {
          recipient = crossChainTransferParameters.receiverAccount;
          receiverChainId = crossChainTransferParameters.receiverChainId;
        }
      }

      k_op.id = encodeOperationId(accountId, requestKey, type);
      k_op.hash = requestKey;
      k_op.type = type;
      k_op.value = baseUnitToKda(value);
      k_op.fee = baseUnitToKda(fee);
      k_op.blockHeight = blockHeight;
      k_op.blockHash = blockHash;
      k_op.accountId = accountId;
      k_op.senders = [sender ?? ""];
      k_op.recipients = [recipient ?? ""];
      k_op.hasFailed = Boolean(result?.badResult && result.badResult !== null);
      k_op.date = date;
      k_op.extra = {
        senderChainId: chainId,
        receiverChainId: receiverChainId,
        isCrossChainTransferFinished: isFinished,
      };

      ops.push(k_op);
    }
  }

  return ops;
};

/**
 * Parses a Pact number value which can be a number, string or object with decimal/int properties
 */
const parsePactNumber = (value: number | string | object): number => {
  if (typeof value === "number") return value;
  if (
    typeof value === "object" &&
    "decimal" in value &&
    typeof (value as any).decimal === "string"
  ) {
    return parseFloat((value as any).decimal);
  }
  if (typeof value === "object" && "int" in value && typeof (value as any).int === "string") {
    return parseInt((value as any).int, 10);
  }
  throw Error(`Failed to parse Pact number: "${value}"`);
};

/**
 * Checks if a transfer's sender matches the provided argument
 */
const matchSender = (transfer: Transfer, arg: number | string | object) => {
  return transfer.senderAccount !== "" ? arg === transfer.senderAccount : true;
};

/**
 * Checks if a transfer's receiver matches the provided argument
 */
const matchReceiver = (transfer: Transfer, arg: number | string | object) => {
  return transfer.receiverAccount !== "" ? arg === transfer.receiverAccount : true;
};

/**
 * Checks if a transfer's amount is less than or equal to the provided argument
 */
const matchAmount = (transfer: Transfer, arg: number | string | object) => {
  return transfer.amount <= parsePactNumber(arg);
};

/**
 * Extracts cross-chain transfer parameters from a transfer event if it exists
 * Returns null if no cross-chain transfer is found
 */
const getCrossChainTransferStart = (transfer: Transfer): CrossChainTransferParameters | null => {
  const match = transfer.transaction.result.events.edges.find(event => {
    const parsedEvent = JSON.parse(event.node.parameters);
    return (
      event.node.name === `TRANSFER_XCHAIN` &&
      matchSender(transfer, parsedEvent[0]) &&
      matchReceiver(transfer, parsedEvent[1]) &&
      matchAmount(transfer, parsedEvent[2])
    );
  });
  if (!match) return null;
  const parsedMatch = JSON.parse(match.node.parameters);
  return {
    receiverAccount: (transfer.receiverAccount ||
      transfer.crossChainTransfer?.receiverAccount ||
      parsedMatch[1]) as string,
    senderAccount: (transfer.senderAccount ||
      transfer.crossChainTransfer?.senderAccount ||
      parsedMatch[0]) as string,
    receiverChainId: parseInt(parsedMatch[3]),
  };
};
