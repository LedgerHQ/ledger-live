import BigNumber from "bignumber.js";
import { z } from "zod";

export const BigNumberSchema = z.custom<BigNumber>(value => BigNumber.isBigNumber(value), {
  message: "Expected BigNumber",
});
