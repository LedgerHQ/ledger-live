import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import {
  fetchAccountBalance,
  fetchBlockHeight,
  fetchEvents,
  fetchTransactions,
} from "./api/network";
import { Event, Transfer } from "./api/types";
import { KADENA_CROSS_CHAIN_TRANSFER_EVENT_NAME, KDA_FEES_BASE } from "./constants";
import { KadenaOperation } from "./types";
import { baseUnitToKda } from "./utils";

/**
 * Converts a public key to a Kadena address by prefixing it with 'k:'
 */
const getAddressFromPublicKey = (pubkey: string): string => {
  return `k:${pubkey}`;
};

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
    operations: await rawTxsToOps(rawTxs, accountId, address),
    blockHeight,
  };

  return result;
};

/**
 * Reconciles the public key from either the provided key or the initial account.
 *
 * @param publicKey - Optional public key string
 * @param initialAccount - Optional initial account object
 * @returns The reconciled public key
 * @throws Error if public key cannot be restored
 */
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

/**
 * Helper to extract cross-chain transfer details according to the transfer direction and status.
 *
 * - For IN cross-chain transfers:
 *   - Sender account and sender chain id are in crossChainTransfer.
 *   - Receiver account is in receiverAccount.
 *   - Receiver chain id is in block.chainId.
 * - For OUT cross-chain transfers:
 *   - If finished (crossChainTransfer is present):
 *     - Receiver info is in crossChainTransfer.
 *     - Sender info is in the root.
 *   - If unfinished (crossChainTransfer is null):
 *     - Sender info is in the root.
 *     - Sender chain id is in block.chainId.
 *     - Receiver info is fetched from events.
 */
const getCrossChainTransferDetails = async (
  transfer: Transfer,
  type: "IN" | "OUT",
): Promise<{
  senderChainId: number;
  receiverAccount?: string;
  receiverChainId?: number;
}> => {
  // IN cross-chain transfer: crossChainTransfer is present and transfer type is IN
  if (type === "IN") {
    return {
      senderChainId: transfer.crossChainTransfer?.block.chainId ?? transfer.block.chainId,
      receiverAccount: transfer.receiverAccount,
      receiverChainId: transfer.block.chainId,
    };
  }

  // OUT cross-chain transfer
  const senderChainId = transfer.block.chainId;

  // OUT cross-chain transfer, finished: crossChainTransfer is present
  if (transfer.crossChainTransfer) {
    return {
      senderChainId,
      receiverAccount: transfer.crossChainTransfer.receiverAccount,
      receiverChainId: transfer.crossChainTransfer.block.chainId,
    };
  }

  // OUT cross-chain transfer, unfinished: crossChainTransfer is null
  // Fetch receiver info from events
  try {
    const events = await fetchEvents(KADENA_CROSS_CHAIN_TRANSFER_EVENT_NAME, transfer.requestKey);
    const crossChainTransferParameters = getCrossChainTransferStart(transfer, events);
    if (crossChainTransferParameters) {
      return {
        senderChainId,
        receiverAccount: crossChainTransferParameters.receiverAccount,
        receiverChainId: crossChainTransferParameters.receiverChainId,
      };
    }
  } catch (error) {
    // Silent error
  }

  return {
    senderChainId,
  };
};

/**
 * Processes a fee transaction into a Kadena operation.
 *
 * @param rawTx - The raw transfer transaction
 * @param accountId - The account ID
 * @param address - The account address
 * @returns A KadenaOperation object representing the fee transaction
 */
const feeTxToOperation = (rawTx: Transfer, accountId: string, address: string): KadenaOperation => {
  const {
    requestKey,
    block: { creationTime, height: blockHeight, hash: blockHash, chainId },
    senderAccount,
    transaction: { result },
  } = rawTx;

  const feeTx = rawTx.transaction.result.gas * Number(KDA_FEES_BASE);
  const date = new Date(creationTime);
  const type = senderAccount === address ? "OUT" : "IN";
  const signer = getSigner(rawTx);

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

  return k_op;
};

/**
 * Helper function to determine if a transaction is a fee-only transaction
 */
const isFeeTx = (feeTx: number, mainTx: number): boolean => {
  return feeTx === mainTx;
};

/**
 * Helper function to process a single transaction into a Kadena operation
 */
const processSingleTx = async (
  rawTx: Transfer,
  accountId: string,
  address: string,
): Promise<KadenaOperation> => {
  const {
    requestKey,
    block: { creationTime, height: blockHeight, hash: blockHash, chainId },
    amount,
    senderAccount,
    receiverAccount,
    crossChainTransfer,
    transaction: { result },
  } = rawTx;

  const feeTx = rawTx.transaction.result.gas * Number(KDA_FEES_BASE);
  const date = new Date(creationTime);
  const value = new BigNumber(amount);
  const fee = new BigNumber(feeTx);
  const sender =
    senderAccount && senderAccount !== "" ? senderAccount : crossChainTransfer?.senderAccount;
  let recipient =
    receiverAccount && receiverAccount !== ""
      ? receiverAccount
      : crossChainTransfer?.receiverAccount;

  const type = senderAccount === address ? "OUT" : "IN";

  const isCrossChain =
    crossChainTransfer !== null || // finished cross-chain transfer (IN or OUT)
    (crossChainTransfer === null && !recipient); // unfinished cross-chain transfer (OUT)

  let senderChainId: number;
  let receiverChainId: number | undefined;

  if (isCrossChain) {
    const crossChainTransferDetails = await getCrossChainTransferDetails(rawTx, type);
    recipient = crossChainTransferDetails.receiverAccount;
    senderChainId = crossChainTransferDetails.senderChainId;
    receiverChainId = crossChainTransferDetails.receiverChainId;
  } else {
    senderChainId = chainId;
    receiverChainId = chainId;
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
      senderChainId,
      receiverChainId,
    },
  };

  return k_op;
};

/**
 * Converts raw transactions into Kadena operations.
 * This function processes both regular and cross-chain transactions,
 * handling fee transactions separately.
 *
 * @param rawTxs - Array of raw transfer transactions
 * @param accountId - The account ID
 * @param address - The account address
 * @returns Promise resolving to an array of KadenaOperation objects
 */
const rawTxsToOps = async (
  rawTxs: Transfer[],
  accountId: string,
  address: string,
): Promise<KadenaOperation[]> => {
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
      const k_op = feeTxToOperation(tempFeeTransaction, accountId, address);
      tempFeeTransaction = null;
      operations.push(k_op);
    }

    const feeTx = rawTx.transaction.result.gas * Number(KDA_FEES_BASE);
    const mainTx = Number(rawTx.amount);

    if (isFeeTx(feeTx, mainTx)) {
      // This is a fee transaction, store it temporarily
      tempFeeTransaction = rawTx;
      continue;
    }

    processedRequestKeys.add(rawTx.requestKey);

    const operation = await processSingleTx(rawTx, accountId, address);
    operations.push(operation);
  }

  return operations;
};

/**
 * Parses a Pact number value which can be a number, string or object with decimal/int properties
 */
const parsePactNumber = (value: number | string | object): number => {
  if (typeof value === "number") return value;
  if (typeof value === "object" && "decimal" in value && typeof value.decimal === "string") {
    return parseFloat(value.decimal);
  }
  if (typeof value === "object" && "int" in value && typeof value.int === "string") {
    return parseInt(value.int, 10);
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

interface CrossChainTransferParameters {
  senderAccount: string;
  receiverAccount: string;
  receiverChainId: number;
}

/**
 * Extracts cross-chain transfer parameters from a transfer event if it exists
 * Returns null if no cross-chain transfer is found
 */
const getCrossChainTransferStart = (
  transfer: Transfer,
  events: Event[],
): CrossChainTransferParameters | null => {
  const match = events.find(event => {
    const parsedEvent = JSON.parse(event.parameters);
    return (
      event.name === "TRANSFER_XCHAIN" &&
      matchSender(transfer, parsedEvent[0]) &&
      matchReceiver(transfer, parsedEvent[1]) &&
      matchAmount(transfer, parsedEvent[2])
    );
  });
  if (!match) return null;
  const parsedMatch = JSON.parse(match.parameters);
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

interface SignerParameters {
  receiverAccount: string;
  receiverChainId: number;
  amount?: BigNumber;
}

/**
 * Extracts signer parameters from a transfer transaction
 * Looks for a coin.TRANSFER signer in the transaction's command list and extracts:
 * - receiver account
 * - transfer amount (if present)
 * - receiver chain ID (if present, otherwise uses transfer's chain ID)
 * Returns null if no matching signer is found
 */
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

export {
  getCrossChainTransferStart,
  getSigner,
  matchAmount,
  matchReceiver,
  matchSender,
  parsePactNumber,
  rawTxsToOps,
};
