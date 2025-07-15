import BigNumber from "bignumber.js";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { MemoNotSupported, TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import { getNodeApi } from "../network/node";
import { EvmAsset, FeeData, isNative, Transaction } from "../types";

export async function estimateFees(
  currency: CryptoCurrency,
  transactionIntent: TransactionIntent<EvmAsset, MemoNotSupported>,
): Promise<bigint> {
  const { amount, asset, recipient, sender } = transactionIntent;

  const nodeApi = getNodeApi(currency);
  const gasLimit = await nodeApi.getGasEstimation(
    { currency, freshAddress: sender },
    {
      amount: new BigNumber(amount.toString()),
      recipient: recipient,
    },
  );

  const tx: Transaction = {
    family: "evm",
    mode: "send",
    amount: BigNumber(amount.toString()),
    recipient: isNative(asset) ? recipient : asset.contractAddress,
    maxFeePerGas: BigNumber(0),
    maxPriorityFeePerGas: BigNumber(0),
    gasLimit,
    nonce: 0,
    chainId: currency.ethereumLikeInfo?.chainId ?? 0,
    feesStrategy: "medium",
    type: 2, // EIP-1559 transaction by default
  };

  const feeData: FeeData = await nodeApi.getFeeData(currency, tx);
  const fee = feeData.maxFeePerGas?.multipliedBy(gasLimit) || new BigNumber(0);

  return BigInt(fee.toString()) || BigInt(0);
}

export default estimateFees;
