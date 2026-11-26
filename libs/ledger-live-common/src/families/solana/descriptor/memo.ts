import type { InputDescriptor } from "../../../bridge/descriptor/types";
import { MAX_MEMO_LENGTH } from "@ledgerhq/coin-solana/logic/validateMemo";

export const memo: InputDescriptor = {
  type: "text",
  maxLength: MAX_MEMO_LENGTH,
};
