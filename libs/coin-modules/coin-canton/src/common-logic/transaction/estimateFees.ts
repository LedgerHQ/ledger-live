import coinConfig from "../../config";

const feeValue = () => coinConfig.getCoinConfig().fee ?? 10_000;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function estimateFees(serializedTransaction: string): Promise<bigint> {
  return Promise.resolve(BigInt(feeValue())); // TODO replace with real implementation
}
