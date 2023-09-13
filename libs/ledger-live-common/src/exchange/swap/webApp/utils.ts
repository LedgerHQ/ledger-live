import { BigNumber } from "bignumber.js";
import { getGasLimit } from "@ledgerhq/coin-evm/logic";
import { getAccountUnit } from "../../../account/index";

export const getCustomFeesPerFamily = transaction => {
  const { family, maxFeePerGas, maxPriorityFeePerGas, customGasLimit, feePerByte } = transaction;

  switch (family) {
    case "evm": {
      return {
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasLimit: getGasLimit(transaction),
        customGasLimit,
      };
    }
    case "bitcoin": {
      return {
        feePerByte,
      };
    }
    default:
      return {};
  }
};

export const convertToNonAtomicUnit = (amount, account) => {
  const fromMagnitude =
    account.type === "TokenAccount"
      ? account.token.units[0].magnitude || 0
      : account.currency?.units[0].magnitude || 0;
  return amount.shiftedBy(-fromMagnitude);
};

export const convertParametersToValidFormat = ({
  operation,
  swapId,
  fromAccount,
  toAccount,
  rate,
}) => {
  const result = { operation, swapId };
  const unitFrom = getAccountUnit(fromAccount);
  const unitTo = getAccountUnit(toAccount);
  const magnitudeAwareRate = new BigNumber(rate).div(
    new BigNumber(10).pow(unitFrom.magnitude - unitTo.magnitude),
  );
  return {
    result,
    magnitudeAwareRate,
  };
};
