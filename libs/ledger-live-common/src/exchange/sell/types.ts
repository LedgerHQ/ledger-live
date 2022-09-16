import type { Transaction } from "../../generated/types";
export type InitSellResult = {
  transaction: Transaction;
};
export type SellRequestEvent =
  | {
      type: "init-sell";
    }
  | {
      type: "init-sell-requested";
    }
  | {
      type: "init-sell-get-transaction-id";
      value: string;
    }
  | {
      type: "init-sell-error";
      error: Error;
    }
  | {
      type: "init-sell-result";
      initSellResult: InitSellResult;
    };
