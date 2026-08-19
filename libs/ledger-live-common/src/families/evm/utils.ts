import { getEIP712FieldsDisplayedOnNano } from "@ledgerhq/evm-tools/message/EIP712/index";
import { getEnv } from "@shared/env";
import type { AnyMessage, MessageProperties } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Unit } from "@domain/entity-currency-unit";
import type { Transaction } from "./types";

export const getDefaultFeeUnit = (currency: CryptoCurrency): Unit =>
  currency.units.length > 1 ? currency.units[1] : currency.units[0];

export const getGasLimit = (tx: Transaction): BigNumber => tx.customGasLimit ?? tx.gasLimit;

export const getEstimatedFees = (tx: Transaction): BigNumber => {
  const gasLimit = getGasLimit(tx);
  if (tx.type !== 2) {
    return tx.gasPrice?.multipliedBy(gasLimit) || new BigNumber(0);
  }
  return tx.maxFeePerGas?.multipliedBy(gasLimit) || new BigNumber(0);
};

export const getMessageProperties = async (
  messageData: AnyMessage,
): Promise<MessageProperties | null> => {
  if (messageData.standard === "EIP712") {
    return getEIP712FieldsDisplayedOnNano(messageData.message, getEnv("CAL_SERVICE_URL"));
  }

  return null;
};
