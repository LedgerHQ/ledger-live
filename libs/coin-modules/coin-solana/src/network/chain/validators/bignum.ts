import { coerce, instance, number, string } from "superstruct";
import { BigNumber } from "bignumber.js";

export const BigNumFromString = coerce(instance(BigNumber), string(), value => {
  if (typeof value === "string") return new BigNumber(value, 10);
  throw new Error("invalid big num");
});

export const BigNumFromNumber = coerce(instance(BigNumber), number(), value => {
  if (typeof value === "number") return new BigNumber(value, 10);
  throw new Error("invalid big num");
});
