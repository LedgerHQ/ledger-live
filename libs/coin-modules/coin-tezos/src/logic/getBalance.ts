import api from "../network/tzkt";

/**
 * Retunrs the balance of the given address.
 * If the address is an empty account, returns -1.
 */
export async function getBalance(address: string): Promise<bigint> {
  const apiAccount = await api.getAccountByAddress(address);
  return apiAccount.type === "user" ? BigInt(apiAccount.balance) : BigInt(-1);
}
