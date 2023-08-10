
import { getGasLimit as getEthGasLimit } from "../../../families/ethereum/transaction"
import { getGasLimit as getEvmGasLimit } from "@ledgerhq/coin-evm/logic";

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
