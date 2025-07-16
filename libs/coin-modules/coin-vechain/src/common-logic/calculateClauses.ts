import BigNumber from "bignumber.js";
import { VechainSDKTransactionClause } from "../types";
import { ABIContract, VIP180_ABI, VTHO_ADDRESS } from "@vechain/sdk-core";

export const calculateClausesVtho = async (
  recipient: string,
  amount: BigNumber,
): Promise<VechainSDKTransactionClause[]> => {
  const clauses: VechainSDKTransactionClause[] = [];

  // Get the existing clause or create a blank one
  const updatedClause: VechainSDKTransactionClause = {
    to: VTHO_ADDRESS,
    value: 0,
    data: "0x",
  };
  updatedClause.data = ABIContract.ofAbi(VIP180_ABI)
    .encodeFunctionInput("transfer", [recipient, amount.toFixed()])
    .toString();

  clauses.push(updatedClause);
  return clauses;
};

export const calculateClausesVet = async (
  recipient: string,
  amount: BigNumber,
): Promise<VechainSDKTransactionClause[]> => {
  const clauses: VechainSDKTransactionClause[] = [];

  // Get the existing clause or create a blank one
  const updatedClause: VechainSDKTransactionClause = {
    to: null,
    value: 0,
    data: "0x",
  };

  updatedClause.value = `0x${amount.toString(16)}`;
  updatedClause.to = recipient;

  clauses.push(updatedClause);

  return clauses;
};
