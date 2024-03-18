import { BigNumber } from "bignumber.js";
import algorandAPI from "./api";
import type { AlgorandOperationMode } from "./types";

export const ALGORAND_MAX_MEMO_SIZE = 32;
export const ALGORAND_MIN_ACCOUNT_BALANCE = 100000;

export const recipientHasAsset = async (
  recipientAddress: string,
  assetId: string,
): Promise<boolean> => {
  const recipientAccount = await algorandAPI.getAccount(recipientAddress);
  return recipientAccount.assets.map(a => a.assetId).includes(assetId);
};

export const isAmountValid = async (
  recipientAddress: string,
  amount: BigNumber,
): Promise<boolean> => {
  const recipientAccount = await algorandAPI.getAccount(recipientAddress);
  return recipientAccount.balance.isZero() ? amount.gte(ALGORAND_MIN_ACCOUNT_BALANCE) : true;
};

export const computeAlgoMaxSpendable = ({
  accountBalance,
  nbAccountAssets,
  mode,
}: {
  accountBalance: BigNumber;
  nbAccountAssets: number;
  mode: AlgorandOperationMode;
}): BigNumber => {
  const minBalance = computeMinimumAlgoBalance(mode, nbAccountAssets);
  const maxSpendable = accountBalance.minus(minBalance);
  return maxSpendable.gte(0) ? maxSpendable : new BigNumber(0);
};

const computeMinimumAlgoBalance = (
  mode: AlgorandOperationMode,
  nbAccountAssets: number,
): BigNumber => {
  const base = 100000; // 0.1 algo = 100000 malgo
  const currentAssets = nbAccountAssets;
  const newAsset = mode === "optIn" ? 1 : 0;
  return new BigNumber(base * (1 + currentAssets + newAsset));
};
