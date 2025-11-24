import { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction as AleoTransaction } from "../types";

export const createTransaction: AccountBridge<AleoTransaction>["createTransaction"] = () => {
  throw new Error("createTransaction is not supported");
};
