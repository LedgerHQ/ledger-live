import { TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { ethers } from "ethers";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { EvmAsset, isNative } from "../types";
import { getNodeApi } from "../network/node";
import ERC20ABI from "../abis/erc20.abi.json";

function getErc20Data(recipient: string, amount: bigint): Buffer {
  const contract = new ethers.utils.Interface(ERC20ABI);
  const data = contract.encodeFunctionData("transfer", [recipient, amount]);
  return Buffer.from(data.slice(2), "hex");
}

export async function craftTransaction(
  currency: CryptoCurrency,
  {
    transactionIntent,
  }: {
    transactionIntent: TransactionIntent<EvmAsset>;
  },
): Promise<string> {
  const { amount, asset, recipient, sender, type } = transactionIntent;

  if (type !== "send") {
    throw new Error(`Unsupported intent type '${type}'. Must be 'send'`);
  }

  const node = getNodeApi(currency);
  const to = isNative(asset) ? recipient : asset.contractAddress;
  const nonce = await node.getTransactionCount(currency, sender);
  const data = isNative(asset) ? Buffer.from([]) : getErc20Data(recipient, amount);
  const value = isNative(asset) ? amount : 0n;
  const chainId = currency.ethereumLikeInfo?.chainId ?? 0;
  const gasLimit = await node.getGasEstimation(
    { currency, freshAddress: sender },
    { amount: BigNumber(value.toString()), recipient: to, data },
  );

  return ethers.utils.serializeTransaction({
    to,
    nonce,
    gasLimit: ethers.BigNumber.from(gasLimit.toFixed(0)),
    data,
    value,
    chainId,
  });
}
