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

  const node = getNodeApi(currency);
  const gasLimit = await node.getGasEstimation(
    { currency, freshAddress: sender },
    {
      amount: new BigNumber(amount.toString()),
      recipient: recipient,
    },
  );

  const tx: Transaction = {
    family: "evm",
    mode: "send",
    amount: new BigNumber(amount.toString()),
    recipient: isNative(asset) ? recipient : asset.contractAddress,
    gasPrice: new BigNumber(0),
    gasLimit,
    nonce: 0,
    chainId: currency.ethereumLikeInfo?.chainId ?? 0,
    feesStrategy: "medium",
    type: 1, // legacy transaction by default
  };

  const feeData: FeeData = await node.getFeeData(currency, tx);
  const fee = feeData.gasPrice?.multipliedBy(gasLimit) || new BigNumber(0);

  return BigInt(fee.toString());
}

export default estimateFees;
