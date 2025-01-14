import { GasEstimation } from "@aptos-labs/ts-sdk";
import { node } from "../network";

export async function estimateGasPrice(): Promise<GasEstimation> {
  const client = await node();

  return client.getGasPriceEstimation();
}
