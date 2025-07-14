import suiAPI from "../network";
import { BigNumber } from "bignumber.js";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import { SuiAsset } from "../api/types";
import { DEFAULT_COIN_TYPE } from "../network/sdk";

export async function estimateFees({
  recipient,
  amount,
  sender,
  asset,
}: TransactionIntent<SuiAsset>): Promise<bigint> {
  const { gasBudget } = await suiAPI.paymentInfo(sender, {
    mode: "send",
    family: "sui",
    recipient,
    amount: BigNumber(amount.toString()),
    errors: {},
    coinType: asset.type === "token" ? asset.coinType : DEFAULT_COIN_TYPE,
  });
  return BigInt(gasBudget);
}
