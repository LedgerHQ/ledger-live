import type { InputDescriptor } from "../../../bridge/descriptor/types";
import { StellarMemoType } from "@ledgerhq/coin-stellar/types";

export const memo: InputDescriptor = {
  type: "typed",
  options: StellarMemoType,
  defaultOption: "MEMO_TEXT",
};
