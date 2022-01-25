import { coerce, instance, string } from "superstruct";
import { BigNumber } from "bignumber.js";

export const BigNumFromString = coerce(
  instance(BigNumber),
  string(),
  (value) => {
    if (typeof value === "string") return new BigNumber(value, 10);
    throw new Error("invalid big num");
  }
);
