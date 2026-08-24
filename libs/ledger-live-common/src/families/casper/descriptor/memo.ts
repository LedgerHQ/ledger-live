import type { InputDescriptor } from "../../../bridge/descriptor/types";

// Text, not "tag": keeps the u64 transfer id (up to 20 digits) as a string so it isn't rounded.
export const memo: InputDescriptor = {
  type: "text",
  maxLength: 20,
};
