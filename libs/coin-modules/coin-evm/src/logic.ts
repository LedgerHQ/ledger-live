import { getEIP712FieldsDisplayedOnNano } from "@ledgerhq/evm-tools/message/EIP712/index";
import { getEnv } from "@ledgerhq/live-env";
import { CryptoCurrency, Unit } from "@ledgerhq/ledger-wallet-framework/types";
import { AnyMessage, MessageProperties } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getNodeApi } from "./network/node/index";

/**
 * Helper to get the currency unit to be used for the fee field
 */
export const getDefaultFeeUnit = (currency: CryptoCurrency): Unit =>
  currency.units.length > 1 ? currency.units[1] : currency.units[0];

/**
 * Helper returning the potential additional fees necessary for layer twos
 * to settle the transaction on layer 1.
 */
export const getAdditionalLayer2Fees = async (
  currency: CryptoCurrency,
  transaction: string,
): Promise<BigNumber | undefined> => {
  switch (currency.id) {
    case "optimism":
    case "optimism_sepolia":
    case "blast":
    case "blast_sepolia":
    case "base":
    case "base_sepolia": {
      const nodeApi = getNodeApi(currency);
      const additionalFees = await nodeApi.getOptimismAdditionalFees(currency, transaction);
      return additionalFees;
    }
    case "scroll": {
      const nodeApi = getNodeApi(currency);
      const additionalFees = await nodeApi.getScrollAdditionalFees(currency, transaction);
      return additionalFees;
    }
    default:
      return;
  }
};

/**
 * Helper to get the message properties to be displayed on the Nano
 */
export const getMessageProperties = async (
  messageData: AnyMessage,
): Promise<MessageProperties | null> => {
  if (messageData.standard === "EIP712") {
    return getEIP712FieldsDisplayedOnNano(messageData.message, getEnv("CAL_SERVICE_URL"));
  }

  return null;
};
