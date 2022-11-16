import { InvalidMinimumAmount } from "@ledgerhq/errors";
import { MINIMUM_VALID_AMOUNT } from "../../consts";
import { motesToCSPR } from "../../utils";

export const invalidMinimumAmountError = (): Error => {
  return new InvalidMinimumAmount(
    `Minimum CSPR to transfer is ${motesToCSPR(
      MINIMUM_VALID_AMOUNT
    ).toNumber()} CSPR`
  );
};

export const invalidTransferIdError = (): Error => {
  return new Error("Invalid Transfer ID");
};
