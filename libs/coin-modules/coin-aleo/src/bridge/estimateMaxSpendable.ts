import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction as AleoTransaction } from "../types";

export const estimateMaxSpendable: AccountBridge<AleoTransaction>["estimateMaxSpendable"] =
  async () => {
    throw new Error("estimateMaxSpendable is not supported");
  };
