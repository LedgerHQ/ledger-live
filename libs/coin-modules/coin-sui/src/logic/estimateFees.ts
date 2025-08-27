import suiAPI from "../network";
import { BigNumber } from "bignumber.js";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import { DEFAULT_COIN_TYPE } from "../network/sdk";

export async function estimateFees({
  recipient,
  amount,
  sender,
  asset,
  type,
}: TransactionIntent): Promise<bigint> {
  let coinType = DEFAULT_COIN_TYPE;
  if (asset.type === "token" && asset.assetReference) {
    coinType = asset.assetReference;
  }

  let mode: "send" | "delegate" | "undelegate";
  switch (type) {
    case "delegate":
      mode = "delegate";
      break;
    case "undelegate":
      mode = "undelegate";
      break;
    default:
      mode = "send";
      break;
  }

  const { gasBudget } = await suiAPI.paymentInfo(sender, {
    mode,
    family: "sui",
    recipient,
    amount: BigNumber(amount.toString()),
    errors: {},
    coinType,
  });
  return BigInt(gasBudget);
}
