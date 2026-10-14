import type { InputDescriptor } from "../../../bridge/descriptor/types";
import { COSMOS_MAX_MEMO_LENGTH } from "../logic";

export const memo: InputDescriptor = {
  type: "text",
  maxLength: COSMOS_MAX_MEMO_LENGTH,
};
