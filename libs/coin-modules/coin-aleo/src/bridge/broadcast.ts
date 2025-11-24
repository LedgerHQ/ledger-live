import { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction as AleoTransaction } from "../types";

export const broadcast: AccountBridge<AleoTransaction>["broadcast"] = () => {
  throw new Error("broadcast is not supported");
};
