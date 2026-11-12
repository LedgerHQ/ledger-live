import type { InputDescriptor } from "../../../bridge/descriptor/types";

export const XRP_TAG_MAX_VALUE = 4294967295; // UINT32_MAX

export const memo: InputDescriptor = {
  type: "tag",
  maxValue: XRP_TAG_MAX_VALUE,
};
