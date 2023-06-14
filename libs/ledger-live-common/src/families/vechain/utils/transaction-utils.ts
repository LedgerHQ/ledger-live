import { getEnv } from "../../../env";
import network from "@ledgerhq/live-network/network";
import { HEX_PREFIX } from "../constants";
import crypto from "crypto";
import BigNumber from "bignumber.js";
import { Transaction as ThorTransaction } from "thor-devkit";
import params from "../contracts/abis/params";
import { BASE_GAS_PRICE_KEY, PARAMS_ADDRESS } from "../contracts/constants";
import { Query } from "../api/types";
import { query } from "../api/sdk";
import { Transaction } from "../types";

const BASE_URL = getEnv("API_VECHAIN_THOREST");
const GAS_COEFFICIENT = 15000;

/**
 * Get the block ref to use in a transaction
 * @returns the block ref of head
 */
export const getBlockRef = async (): Promise<string> => {
  const { data } = await network({
    method: "GET",
    url: `${BASE_URL}/blocks/best`,
  });

  return data.id.slice(0, 18);
};

/**
 * Generate a Unique ID to be used as a nonce
 * @returns a unique string
 */
export const generateNonce = (): string => {
  const randBuffer = crypto.randomBytes(Math.ceil(4));
  if (!randBuffer) throw Error("Failed to generate random hex");
  return `${HEX_PREFIX}${randBuffer.toString("hex").substring(0, 8)}`;
};

/**
 * Estimate the gas that will be used by the transaction.
 * @param transaction - The transaction to estimate the gas for
 * @returns an estimate of the gas usage
 */
export const estimateGas = async (t: Transaction): Promise<number> => {
  const intrinsicGas = ThorTransaction.intrinsicGas(t.body.clauses);

  const queryData: Query[] = [];

  t.body.clauses.forEach(c => {
    if (c.to) {
      queryData.push({
        to: c.to,
        data: c.data,
      });
    }
  });

  const response = await query(queryData);

  const execGas = response.reduce((sum, out) => sum + out.gasUsed, 0);

  return intrinsicGas + (execGas ? execGas + GAS_COEFFICIENT : 0);
};

const getBaseGasPrice = async (): Promise<string> => {
  const queryData: Query = {
    to: PARAMS_ADDRESS,
    data: params.get.encode(BASE_GAS_PRICE_KEY),
  };

  const response = await query([queryData]);

  // Expect 1 value
  if (response && response.length != 1) throw Error("Unexpected response received for query");

  return response[0].data;
};

/**
 * Calculate the fee in VTHO
 * @param gas - the gas used
 * @param gasPriceCoef - the gas price coefficient
 * @returns the fee in VTHO
 */
export const calculateFee = async (gas: BigNumber, gasPriceCoef: number): Promise<BigNumber> => {
  const baseGasPrice = await getBaseGasPrice();
  return new BigNumber(baseGasPrice)
    .times(gasPriceCoef)
    .idiv(255)
    .plus(baseGasPrice)
    .times(gas);
};

/**
 * Get fees paid for the transaction
 * @param transactionId - the id of the transaction
 * @return the fee paid in VTHO or 0
 */
export const getFees = async (transactionID: string): Promise<BigNumber> => {
  const { data } = await network({
    method: "GET",
    url: `${BASE_URL}/transactions/${transactionID}/receipt`,
    params: { id: transactionID },
  });

  if (!data || !data.paid) return new BigNumber(0);
  return new BigNumber(data.paid);
};
