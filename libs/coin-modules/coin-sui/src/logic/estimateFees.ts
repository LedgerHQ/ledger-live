import suiAPI from "../network";

export async function estimateFees(sender: string, transaction: any): Promise<bigint> {
  const { gasBudget } = await suiAPI.paymentInfo(sender, transaction);
  return BigInt(gasBudget);
}
