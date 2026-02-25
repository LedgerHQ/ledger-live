import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";

/**
 *
 */
export type SwapOperation = {
  provider: string;
  swapId: string;
  status: string;
  receiverAccountId: string;
  tokenId?: string;
  fromCurrency?: CryptoOrTokenCurrency;
  toCurrency?: CryptoOrTokenCurrency;
  operationId: string;
  fromAmount: BigNumber;
  toAmount: BigNumber;
};

/**
 *
 */
export type SwapOperationRaw = {
  provider: string;
  swapId: string;
  status: string;
  receiverAccountId: string;
  tokenId?: string;
  operationId: string;
  fromAmount: string;
  toAmount: string;
};
