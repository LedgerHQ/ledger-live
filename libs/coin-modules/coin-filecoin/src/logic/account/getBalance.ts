import type { Balance } from "@ledgerhq/coin-module-framework/api/index";
import { fetchBalances, fetchERC20TokenBalance } from "../../api/api";

/**
 * Returns the native FIL balance and all known token balances for an address.
 *
 * Token balances are returned with `value: 0n` when the account holds none,
 * so consumers can distinguish "zero balance" from "not synced".
 *
 * @param address - Filecoin address (f1, f4, or 0x format)
 * @param tokenContracts - Optional list of ERC-20 contract addresses to query.
 *   When provided, a Balance entry is returned for each contract (even if zero).
 */
export async function getBalance(
  address: string,
  tokenContracts?: string[],
): Promise<Balance[]> {
  const balanceResponse = await fetchBalances(address);

  const balances: Balance[] = [
    {
      asset: { type: "native" },
      value: BigInt(balanceResponse.spendable_balance),
      locked: BigInt(balanceResponse.locked_balance ?? "0"),
    },
  ];

  if (tokenContracts && tokenContracts.length > 0) {
    const tokenResults = await Promise.all(
      tokenContracts.map(async contract => {
        const canonical = contract.toLowerCase();
        try {
          const raw = await fetchERC20TokenBalance(address, canonical);
          return { contract: canonical, value: BigInt(raw) };
        } catch {
          return { contract: canonical, value: 0n };
        }
      }),
    );

    for (const { contract, value } of tokenResults) {
      balances.push({
        asset: { type: "token", assetReference: contract },
        value,
      });
    }
  }

  return balances;
}
