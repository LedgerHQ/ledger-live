import { getEnv } from "../../../env";
import network from "@ledgerhq/live-network/network";
import { AccountResponse, VetTxsQuery, TokenTxsQuery, Query, QueryResponse } from "./types";
import type { Operation } from "@ledgerhq/types-live";
import { mapVetTransfersToOperations, mapTokenTransfersToOperations } from "../utils/mapping-utils";
import { padAddress } from "../utils/pad-address";
import { TransferEventSignature } from "../contracts/constants";
import { Transaction } from "thor-devkit";
import { HEX_PREFIX } from "../constants";

const BASE_URL = getEnv("API_VECHAIN_THOREST");

export const getAccount = async (address: string): Promise<AccountResponse> => {
  const { data } = await network({
    method: "GET",
    url: `${BASE_URL}/accounts/${address}`,
  });

  return data;
};

export const getLastBlock = async (): Promise<{ number: number }> => {
  const { data } = await network({
    method: "GET",
    url: `${BASE_URL}/blocks/best`,
  });

  return data;
};

/**
 * Get VET operations
 * @param accountId
 * @param addr
 * @param startAt
 * @returns an array of operations
 */
export const getOperations = async (
  accountId: string,
  addr: string,
  startAt: number,
): Promise<Operation[]> => {
  const query: VetTxsQuery = {
    range: {
      unit: "block",
      from: startAt,
    },
    criteriaSet: [{ sender: addr }, { recipient: addr }],
    order: "desc",
  };

  const { data } = await network({
    method: "POST",
    url: `${BASE_URL}/logs/transfer`,
    data: JSON.stringify(query),
  });

  const operations: Operation[] = await mapVetTransfersToOperations(data, accountId, addr);

  return operations;
};

/**
 * Get operations for a fungible token
 * @param accountId
 * @param addr
 * @param tokenAddr - The token address (The VTHO token address is available from constants.ts)
 * @param startAt
 * @returns an array of operations
 */
export const getTokenOperations = async (
  accountId: string,
  addr: string,
  tokenAddr: string,
  startAt: number,
): Promise<Operation[]> => {
  const paddedAddress = padAddress(addr);

  const query: TokenTxsQuery = {
    range: {
      unit: "block",
      from: startAt,
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

  const { data } = await network({
    method: "POST",
    url: `${BASE_URL}/logs/event`,
    data: JSON.stringify(query),
  });

  const operations = await mapTokenTransfersToOperations(data, accountId, addr);
  return operations;
};

/**
 * Submit a transaction and return the ID
 * @param tx - The transaction to submit
 * @returns transaction ID
 */
export const submit = async (tx: Transaction): Promise<string> => {
  const encodedRawTx = {
    raw: `${HEX_PREFIX}${tx.encode().toString("hex")}`,
  };

  const { data } = await network({
    method: "POST",
    url: `${BASE_URL}/transactions`,
    data: encodedRawTx,
  });

  // Expect a transaction ID
  if (!data.id) throw Error("Expected an ID to be returned");

  return data.id;
};

/**
 * Query the blockchain
 * @param queryData - The query data
 * @returns a result of the query
 */
export const query = async (queryData: Query[]): Promise<QueryResponse[]> => {
  const { data } = await network({
    method: "POST",
    url: `${BASE_URL}/accounts/*`,
    data: { clauses: queryData },
  });

  return data;
};
