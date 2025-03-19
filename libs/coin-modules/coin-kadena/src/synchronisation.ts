import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/lib-es/operation";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { fetchAccountBalance, fetchBlockHeight, fetchTransactions } from "./api/network";
import { Transfer } from "./api/types";
import { KDA_FEES_BASE } from "./constants";
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

interface SignerParameters {
  receiverAccount: string;
  receiverChainId: number;
  amount?: BigNumber;
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

  const lastBlockHeight = initialAccount?.blockHeight;

  const address = getAddressFromPublicKey(pubKey);

  const rawTxs = await fetchTransactions(address, lastBlockHeight);

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
  const processedRequestKeys = new Set();
  const operations: KadenaOperation[] = [];
  let tempFeeTransaction: Transfer | null = null;

  for (const rawTx of rawTxs) {
    // Skip if not from coin module or already processed
    if (rawTx.moduleName !== "coin" || processedRequestKeys.has(rawTx.requestKey)) {
      continue;
    }

    // Clear temp fee transaction since we found its main transaction
    if (tempFeeTransaction?.requestKey === rawTx.requestKey) {
      tempFeeTransaction = null;
    }

    // If we have a remaining fee transaction, it means it was standalone
    if (tempFeeTransaction) {
      const {
        requestKey,
        block: { creationTime, height: blockHeight, hash: blockHash, chainId },
        senderAccount,
        transaction: { result },
      } = tempFeeTransaction;

      const feeTx = tempFeeTransaction.transaction.result.gas * Number(KDA_FEES_BASE);
      const date = new Date(creationTime);
      const type = senderAccount === address ? "OUT" : "IN";
      const signer = getSigner(tempFeeTransaction);

      const k_op: KadenaOperation = {
        id: encodeOperationId(accountId, requestKey, type),
        hash: requestKey,
        type,
        value: signer?.amount ?? BigNumber(0),
        fee: baseUnitToKda(feeTx),
        blockHeight,
        blockHash,
        accountId,
        senders: [senderAccount ?? ""],
        recipients: [signer?.receiverAccount ?? ""], // No recipient for fee-only transaction
        hasFailed: Boolean(result?.badResult && result.badResult !== null),
        date,
        extra: {
          senderChainId: chainId,
          receiverChainId: signer?.receiverChainId,
        },
      };

      tempFeeTransaction = null;
      operations.push(k_op);
    }

    const feeTx = rawTx.transaction.result.gas * Number(KDA_FEES_BASE);
    const mainTx = rawTx.amount;

    if (feeTx === mainTx) {
      // This is a fee transaction, store it temporarily
      tempFeeTransaction = rawTx;
      continue;
    }

    processedRequestKeys.add(rawTx.requestKey);

    const {
      requestKey,
      block: { creationTime, height: blockHeight, hash: blockHash, chainId },
      amount,
      senderAccount,
      receiverAccount,
      crossChainTransfer,
      transaction: { result },
    } = rawTx;
    const date = new Date(creationTime);
    const value = new BigNumber(amount);
    const fee = new BigNumber(feeTx);
    const sender =
      senderAccount && senderAccount !== "" ? senderAccount : crossChainTransfer?.senderAccount;
    let recipient =
      receiverAccount && receiverAccount !== ""
        ? receiverAccount
        : crossChainTransfer?.receiverAccount;
    let receiverChainId = crossChainTransfer?.block?.chainId ?? chainId;
    const isCrossChain = crossChainTransfer !== null || (crossChainTransfer === null && !recipient);
    const isFinished = Boolean(crossChainTransfer);
    const isSending = senderAccount === address;
    const type = isSending ? "OUT" : "IN";

    if (isCrossChain && !isFinished) {
      const crossChainTransferParameters = getCrossChainTransferStart(rawTx);
      if (crossChainTransferParameters) {
        recipient = crossChainTransferParameters.receiverAccount;
        receiverChainId = crossChainTransferParameters.receiverChainId;
      }
    }

    const k_op: KadenaOperation = {
      id: encodeOperationId(accountId, requestKey, type),
      hash: requestKey,
      type,
      value: baseUnitToKda(value),
      fee: baseUnitToKda(fee),
      blockHeight,
      blockHash,
      accountId,
      senders: [sender ?? ""],
      recipients: [recipient ?? ""],
      hasFailed: Boolean(result?.badResult && result.badResult !== null),
      date,
      extra: {
        senderChainId: chainId,
        receiverChainId: receiverChainId,
        isCrossChainTransferFinished: isFinished,
      },
    };

    operations.push(k_op);
  }

  return operations;
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

const getSigner = (transfer: Transfer): SignerParameters | null => {
  const match = transfer.transaction.cmd.signers[0].clist.find(signer => {
    const parsedEvent = JSON.parse(signer.args);
    return signer.name === `coin.TRANSFER` && matchSender(transfer, parsedEvent[0]);
  });
  if (!match) return null;
  const parsedMatch = JSON.parse(match.args);
  const amount = parsedMatch[2] ? parsePactNumber(parsedMatch[2]) : undefined;
  return {
    receiverAccount: parsedMatch[1] as string,
    amount: amount ? BigNumber(amount) : undefined,
    receiverChainId: parsedMatch[3] ? parseInt(parsedMatch[3]) : transfer.block.chainId,
  };
};
