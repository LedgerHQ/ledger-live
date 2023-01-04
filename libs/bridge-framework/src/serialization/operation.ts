import { BigNumber } from "bignumber.js";
import type {
  Operation,
  OperationRaw,
  SubAccount,
} from "@ledgerhq/types-live";
import {
  toOperationRaw as coinToOperationRaw,
  fromOperationRaw as coinFromOperationRaw
} from "@ledgerhq/coin-framework/lib/serialization/operation";
import Bridge from "../bridge/new";
import { inferFamilyFromAccountId } from "@ledgerhq/coin-framework/lib/account";

export const toOperationRaw = (
  operation: Operation,
  preserveSubOperation?: boolean
): OperationRaw => {
  let extractExtra: ((e: Record<string, any>) => Record<string, any>) | undefined = undefined;

  const family = inferFamilyFromAccountId(operation.accountId);
  if (family) {
    extractExtra = (e: Record<string, any>) => Bridge.getInstance().toOperationExtraRaw(family, e)
  }

  return coinToOperationRaw(
    operation,
    extractExtra,
    preserveSubOperation
  );
};

export const fromOperationRaw = (
  operation: OperationRaw,
  accountId: string,
  subAccounts?: SubAccount[] | null | undefined
): Operation => {
  let extractExtra: ((e: Record<string, any>) => Record<string, any>) | undefined = undefined;

  const family = inferFamilyFromAccountId(operation.accountId);
  if (family) {
    extractExtra = (e: Record<string, any>) => Bridge.getInstance().fromOperationExtraRaw(family, e)
  }

  return coinFromOperationRaw(operation, accountId, extractExtra, subAccounts)
};

// Moved from exchange/swap/types
export type SwapOperation = {
  provider: string;
  swapId: string;
  status: string;
  receiverAccountId: string;
  tokenId?: string;
  operationId: string;
  fromAmount: BigNumber;
  toAmount: BigNumber;
};
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

export function fromSwapOperationRaw(raw: SwapOperationRaw): SwapOperation {
  const { fromAmount, toAmount } = raw;
  return {
    ...raw,
    fromAmount: new BigNumber(fromAmount),
    toAmount: new BigNumber(toAmount),
  };
}
export function toSwapOperationRaw(so: SwapOperation): SwapOperationRaw {
  const { fromAmount, toAmount } = so;
  return {
    ...so,
    fromAmount: fromAmount.toString(),
    toAmount: toAmount.toString(),
  };
}