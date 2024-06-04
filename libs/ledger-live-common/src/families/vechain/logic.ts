import BigNumber from "bignumber.js";
import { Transaction as VeChainThorTransaction } from "thor-devkit";
import { VTHO_ADDRESS } from "./contracts/constants";
import VIP180 from "./contracts/abis/VIP180";
import { HEX_PREFIX } from "./constants";

export const calculateClausesVtho = async (
  recipient: string,
  amount: BigNumber,
): Promise<VeChainThorTransaction.Clause[]> => {
  const clauses: VeChainThorTransaction.Clause[] = [];

  // Get the existing clause or create a blank one
  const updatedClause: VeChainThorTransaction.Clause = {
    to: VTHO_ADDRESS,
    value: 0,
    data: "0x",
  };
  updatedClause.data = VIP180.transfer.encode(recipient, amount.toFixed());

  clauses.push(updatedClause);
  return clauses;
};

export const calculateClausesVet = async (
  recipient: string,
  amount: BigNumber,
): Promise<VeChainThorTransaction.Clause[]> => {
  const clauses: VeChainThorTransaction.Clause[] = [];

  // Get the existing clause or create a blank one
  const updatedClause: VeChainThorTransaction.Clause = {
    to: null,
    value: 0,
    data: "0x",
  };

  updatedClause.value = `${HEX_PREFIX}${amount.toString(16)}`;
  updatedClause.to = recipient;

  clauses.push(updatedClause);

  return clauses;
};
