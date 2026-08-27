import { CASPER_MAX_TRANSFER_ID } from "@ledgerhq/coin-casper/constants";
import type { InputDescriptor } from "../../../bridge/descriptor/types";

export const memo: InputDescriptor = {
  type: "tag",
  maxValue: BigInt(CASPER_MAX_TRANSFER_ID) - 1n,
};
