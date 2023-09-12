import { BigNumber } from "bignumber.js";
import { getGasLimit as getEthGasLimit } from "../../../families/ethereum/transaction";
import { getGasLimit as getEvmGasLimit } from "@ledgerhq/coin-evm/logic";
import { getAccountUnit } from "../../../account/index";

export const getCustomFeesPerFamily = transaction => {
  const { family, maxFeePerGas, maxPriorityFeePerGas, userGasLimit, customGasLimit, feePerByte } =
    transaction;

  switch (family) {
    case "ethereum": {
      return {
        maxFeePerGas,
        maxPriorityFeePerGas,
        userGasLimit,
        gasLimit: getEthGasLimit(transaction),
      };
    }
    case "evm": {
      return {
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasLimit: getEvmGasLimit(transaction),
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
