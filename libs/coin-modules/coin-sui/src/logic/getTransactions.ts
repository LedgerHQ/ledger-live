import {
  AccountTransaction,
  Cursor,
  Direction,
  Page,
} from "@ledgerhq/coin-framework/lib/api/types";
import { getTransactions as sdkGetTransactions } from "../network/sdk";

export const getTransactions = async (
  address: string,
  direction?: Direction,
  minHeight?: number,
  maxHeight?: number,
  cursor?: Cursor,
): Promise<Page<AccountTransaction>> => {
  return await sdkGetTransactions(address, direction, minHeight, maxHeight, cursor);
};
