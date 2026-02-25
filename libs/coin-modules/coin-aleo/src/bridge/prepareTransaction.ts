import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction as AleoTransaction } from "../types";

export const prepareTransaction: AccountBridge<AleoTransaction>["prepareTransaction"] = () => {
  throw new Error("prepareTransaction is not supported");
};
