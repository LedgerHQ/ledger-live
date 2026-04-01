import type { InputDescriptor } from "../../../bridge/descriptor/types";

export const memo: InputDescriptor = {
  type: "tag",
  maxValue: 4294967295, // UINT32_MAX
};
