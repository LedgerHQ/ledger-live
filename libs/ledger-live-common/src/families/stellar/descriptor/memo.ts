import type { InputDescriptor } from "../../../bridge/descriptor/types";
import { StellarMemoType } from "@ledgerhq/coin-stellar/types/bridge";

export const memo: InputDescriptor = {
  type: "typed",
  options: StellarMemoType,
  defaultOption: "MEMO_TEXT",
};
