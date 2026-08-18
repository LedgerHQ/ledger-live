import type { InputDescriptor } from "../../../bridge/descriptor/types";
import { ALGORAND_MAX_MEMO_SIZE } from "../logic";

export const memo: InputDescriptor = {
  type: "text",
  maxLength: ALGORAND_MAX_MEMO_SIZE,
};
