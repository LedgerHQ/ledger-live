import { TypedMapMemo } from "@ledgerhq/coin-framework/api/types";

export type AccountInfo = {
  isNewAccount: boolean;
  balance: string;
  ownerCount: number;
  sequence: number;
};

export type XrpMemo = {
  data?: string;
  format?: string;
  type?: string;
};

export type XrpMemoKind = "destinationTag" | "memo";

export type XrpMemoValueMap = {
  destinationTag: string;
  memos: string[];
};
export type XrpMapMemo = TypedMapMemo<XrpMemoValueMap>;

type Order = "asc" | "desc";

export type ListOperationsOptions = {
  // pagination:
  limit?: number;
  token?: string;
  order?: Order;
  // filters:
  minHeight?: number;
};
