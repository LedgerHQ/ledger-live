import network from "@ledgerhq/live-network";
import type {
  AccountResponse,
  VetTxsQuery,
  TokenTxsQuery,
  TransferLog,
  EventLog,
  VechainSDKTransaction,
} from "../types";
import type { Operation } from "@ledgerhq/types-live";
import {
  mapVetTransfersToOperations,
  mapTokenTransfersToOperations,
  padAddress,
} from "../common-logic";
import { getEnv } from "@ledgerhq/live-env";

const BASE_URL = getEnv("API_VECHAIN_THOREST");
const NET_ERROR_LOG_TRANSFERS_LIMIT = {
  status: 403,
  msgPattern: /exceeds the maximum allowed/,
};

export const getAccount = async (address: string): Promise<AccountResponse> => {
  const { data } = await network<AccountResponse>({
    method: "GET",
    url: `${BASE_URL}/accounts/${address}`,
  });

  return data;
};

export const getLastBlockHeight = async (): Promise<number> => {
  const { data } = await network<{ number: number }>({
    method: "GET",
    url: `${BASE_URL}/blocks/best`,
  });

  return data.number;
};

/**
 * Get VET operations (transfers log)
 * @param accountId
 * @param addr
 * @param startAt
 * @param stopAt
 * @returns an array of operations
 */
const fetchRangeOfOperations = async (
  accountId: string,
  addr: string,
  startAt: number,
  stopAt: number,
): Promise<Operation[]> => {
  const query: VetTxsQuery = {
    range: {
      unit: "block",
      from: startAt,
      to: stopAt,
    },
    criteriaSet: [{ sender: addr }, { recipient: addr }],
    order: "desc",
  };

  const { data } = await network<TransferLog[]>({
    method: "POST",
    url: `${BASE_URL}/logs/transfer`,
    data: JSON.stringify(query),
  });

  return mapVetTransfersToOperations(data, accountId, addr);
};

/**
 * Get VTHO token events (transfer events log)
 * @param accountId
 * @param addr
 * @param startAt
 * @param stopAt
 * @returns an array of operations
 */
const fetchRangeOfTokenOperations = async (
  accountId: string,
  addr: string,
  tokenAddr: string,
  startAt: number,
  stopAt: number,
): Promise<Operation[]> => {
  const paddedAddress = padAddress(addr);

  const TransferEventSignature =
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

  const query: TokenTxsQuery = {
    range: {
      unit: "block",
      from: startAt,
      to: stopAt,
    },
    criteriaSet: [
      {
        address: tokenAddr,
        topic0: TransferEventSignature,
        topic1: paddedAddress,
      },
      {
        address: tokenAddr,
        topic0: TransferEventSignature,
        topic2: paddedAddress,
      },
    ],
    order: "desc",
  };

  const { data } = await network<EventLog[]>({
    method: "POST",
    url: `${BASE_URL}/logs/event`,
    data: JSON.stringify(query),
  });

  return mapTokenTransfersToOperations(data, accountId, addr);
};

/**
 * Utility for retrieving logs (transfer logs or transfer event logs) with pagination.
 *
 * This function retrieves the operations in the given range.
 * It attempts to recover when the provided range leads to an unpredictable
 * fetch error, where the transfers log (ie, operations) are more than a fixed limit
 * set by the server (1000 at the moment of writing).
 *
 * The function returns after only one iteration if the first request to retrieve
 * VET operations does not throw a `403 maximum allowed value of 1000`.
 * When instead it catches this error, it then attempts to retrieve only the operations
 * in the first half of the range of blocks.
 * It keeps splitting the range until it manages to retrieve an array of operations
 * successfully.
 * After the first success it updates again the range to retrieve the next portion
 * of the initial range, and so on.
 *
 * @param startAt
 * @param stopAt
 * @param fetchRangeOfLogs - function for retrieving a range a logs (event or transfer)
 * @returns an array of operations
 */
const getLogsWithPagination = async (
  startAt: number,
  stopAt: number,
  fetchRangeOfLogs: (from: number, to: number) => Promise<Operation[]>,
): Promise<Operation[]> => {
  let completed = false;
  const ops: Operation[] = [];

  let from = startAt;
  let to = stopAt;

  while (!completed) {
    try {
      // returns data in descending order
      const data = await fetchRangeOfLogs(from, to);
      // adds data to the beginning of the ops array to preserve descending order
      ops.unshift(...data);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const error = err as { status: number; message: string };

      if (
        error.status === NET_ERROR_LOG_TRANSFERS_LIMIT.status &&
        NET_ERROR_LOG_TRANSFERS_LIMIT.msgPattern.exec(error.message)
      ) {
        const nextTo = from + Math.floor((to - from) / 2);

        if (nextTo <= from) {
          throw new Error(
            `Unable to split VeChain operations range further: API still rejects block range ${from}-${to}.`,
          );
        }

        to = nextTo;
        continue;
      }

      throw err;
    }

    if (to === stopAt) {
      completed = true;
    } else {
      from = to + 1;
      to = stopAt;
    }
  }

  return ops;
};

/**
 * Get VET operations
 *
 * @param accountId
 * @param addr - The VET address
 * @param startAt
 * @param stopAt
 * @param fetchRangeOfLogs
 * @returns an array of operations
 */
export const getOperations = async (
  accountId: string,
  addr: string,
  startAt: number,
  stopAt: number,
): Promise<Operation[]> => {
  const fetchRange = async (from: number, to: number) =>
    fetchRangeOfOperations(accountId, addr, from, to);
  return getLogsWithPagination(startAt, stopAt, fetchRange);
};

/**
 * Get operations for a fungible token
 *
 * @param accountId
 * @param addr - The VET address
 * @param tokenAddr - The token address (The VTHO token address is available from constants.ts)
 * @param startAt
 * @param stopAt
 * @returns an array of operations
 */
export const getTokenOperations = async (
  accountId: string,
  addr: string,
  tokenAddr: string,
  startAt: number,
  stopAt: number,
): Promise<Operation[]> => {
  const fetchRange = async (from: number, to: number) =>
    fetchRangeOfTokenOperations(accountId, addr, tokenAddr, from, to);
  return getLogsWithPagination(startAt, stopAt, fetchRange);
};

/**
 * Submit a transaction and return the ID
 * @param transaction - The transaction to submit
 * @returns transaction ID
 */
export const submit = async (transaction: VechainSDKTransaction): Promise<string> => {
  const encodedRawTx = {
    raw: `0x${Buffer.from(transaction.encoded).toString("hex")}`,
  };

  const { data } = await network<{ id: string }>({
    method: "POST",
    url: `${BASE_URL}/transactions`,
    data: encodedRawTx,
  });

  // Expect a transaction ID
  if (!data.id) throw Error("Expected an ID to be returned");

  return data.id;
};

/**
 * Get the block ref to use in a transaction
 * @returns the block ref of head
 */
export const getBlockRef = async (): Promise<string> => {
  const { data } = await network<{ id: string }>({
    method: "GET",
    url: `${BASE_URL}/blocks/best`,
  });

  return data.id.slice(0, 18);
};
