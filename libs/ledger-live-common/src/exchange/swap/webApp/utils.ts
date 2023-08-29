import { getGasLimit } from "@ledgerhq/coin-evm/logic";

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
