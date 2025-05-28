import { MapMemo, Memo } from "@ledgerhq/coin-framework/api/types";

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

export type XrpMapMemo = MapMemo<XrpMemoKind, string>;
export interface MapMemo<Kind, Value> extends Memo {
  memos: Map<Kind, Value>;
}
//
// export type XrpMemoMap extends MapMemo<XrpMemoKind, XrpMemo> {}
//
type Order = "asc" | "desc";
export type ListOperationsOptions = {
  // pagination:
  limit?: number;
  token?: string;
  order?: Order;
  // filters:
  minHeight?: number;
};
