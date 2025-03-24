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

type Order = "asc" | "desc";
export type ListOperationsOptions = {
  // pagination:
  limit?: number;
  token?: string;
  order?: Order;
  // filters:
  minHeight?: number;
};
