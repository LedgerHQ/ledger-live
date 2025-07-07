import BigNumber from "bignumber.js";
import { VTHO_ADDRESS } from "../contracts/constants";
import { VIP180 } from "../contracts/abis/VIP180";
import { VechainSDKTransactionClause } from "../types";

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
  updatedClause.data = VIP180.transfer.encodeData([recipient, amount.toFixed()]).toString();

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
