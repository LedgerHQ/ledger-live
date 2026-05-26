import { BigNumber } from "bignumber.js";

export enum Methods {
  Transfer = 0,
  ERC20Transfer = 1,
  InvokeEVM = 3844450837,
}

export const calculateEstimatedFees = (gasFeeCap: BigNumber, gasLimit: BigNumber): BigNumber =>
  gasFeeCap.multipliedBy(gasLimit);
