import BigNumber from "bignumber.js";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  BASE_USD_FEE_BY_OPERATION_TYPE,
  DEFAULT_GAS_LIMIT,
  DEFAULT_GAS_PRICE_TINYBARS,
  DEFAULT_TINYBAR_FEE,
  ESTIMATED_FEE_SAFETY_RATE,
  ESTIMATED_GAS_SAFETY_RATE,
  HEDERA_OPERATION_TYPES,
} from "../constants";
import { apiClient } from "../network/api";
import type { EstimateFeesParams, EstimateFeesResult } from "../types";
import { getCurrencyToUSDRate, toEVMAddress } from "./utils";

const estimateContractCallFees = async (
  txIntent: TransactionIntent,
): Promise<EstimateFeesResult> => {
  let tinybars = new BigNumber(0);
  let gas = new BigNumber(0);

  const tokenEvmAddress = "assetReference" in txIntent.asset ? txIntent.asset.assetReference : null;
  const senderEvmAddress = toEVMAddress(txIntent.sender);
  const recipientEvmAddress = toEVMAddress(txIntent.recipient);

  if (!tokenEvmAddress || !senderEvmAddress || !recipientEvmAddress) {
    return {
      tinybars,
    };
  }

  try {
    const [networkFees, gasLimit] = await Promise.all([
      apiClient.getNetworkFees(),
      apiClient.estimateContractCallGas(
        senderEvmAddress,
        recipientEvmAddress,
        tokenEvmAddress,
        txIntent.amount,
      ),
    ]);

    const contractCallFees = networkFees.fees.find(
      fee => fee.transaction_type === HEDERA_OPERATION_TYPES.ContractCall,
    );
    const gasTinybarRate = new BigNumber(contractCallFees?.gas ?? DEFAULT_GAS_PRICE_TINYBARS);
    gas = gasLimit.multipliedBy(ESTIMATED_GAS_SAFETY_RATE).integerValue(BigNumber.ROUND_CEIL);
    tinybars = gas.multipliedBy(gasTinybarRate).integerValue(BigNumber.ROUND_CEIL);
  } catch {
    const gasTinybarRate = DEFAULT_GAS_PRICE_TINYBARS;
    gas = DEFAULT_GAS_LIMIT;
    tinybars = gas.multipliedBy(gasTinybarRate).integerValue(BigNumber.ROUND_CEIL);
  }

  return {
    tinybars,
    gas,
  };
};

const estimateStandardFees = async (
  currency: CryptoCurrency,
  operationType: HEDERA_OPERATION_TYPES,
): Promise<EstimateFeesResult> => {
  let tinybars: BigNumber;
  const usdRate = await getCurrencyToUSDRate(currency).catch(() => null);

  if (usdRate) {
    tinybars = new BigNumber(BASE_USD_FEE_BY_OPERATION_TYPE[operationType])
      .dividedBy(new BigNumber(usdRate))
      .integerValue(BigNumber.ROUND_CEIL)
      .multipliedBy(ESTIMATED_FEE_SAFETY_RATE);
  } else {
    tinybars = new BigNumber(DEFAULT_TINYBAR_FEE).multipliedBy(ESTIMATED_FEE_SAFETY_RATE);
  }

  return {
    tinybars,
  };
};

export const estimateFees = async (params: EstimateFeesParams): Promise<EstimateFeesResult> => {
  if (params.operationType === HEDERA_OPERATION_TYPES.ContractCall) {
    return estimateContractCallFees(params.txIntent);
  }

  return estimateStandardFees(params.currency, params.operationType);
};
