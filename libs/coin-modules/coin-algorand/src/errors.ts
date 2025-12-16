import { createCustomErrorClass } from "@ledgerhq/errors";

export const AlgorandASANotOptInInRecipient = createCustomErrorClass(
  "AlgorandASANotOptInInRecipient",
);

export const AlgorandMemoExceededSizeError = createCustomErrorClass(
  "AlgorandMemoExceededSizeError",
);
