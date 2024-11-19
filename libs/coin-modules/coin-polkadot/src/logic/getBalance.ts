import network from "../network";

export async function getBalance(addr: string): Promise<bigint> {
  const balances = await network.getBalances(addr);
  return BigInt(balances.balance.toString());
}
