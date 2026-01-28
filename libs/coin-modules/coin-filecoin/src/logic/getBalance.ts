import { log } from "@ledgerhq/logs";
import {
  fetchBalances,
  fetchERC20TransactionsWithPages,
  fetchERC20TokenBalance,
} from "../network/api";
import type { Balance } from "@ledgerhq/coin-framework/api/index";

/**
 * Get native FIL and ERC20 token balances for an address.
 *
 * Token discovery is done via ERC20 transaction history - tokens without
 * transactions won't be discovered.
 *
 * @param address - The Filecoin address to check
 * @returns Array of Balance objects (native + tokens)
 */
export async function getBalance(address: string): Promise<Balance[]> {
  const balances: Balance[] = [];

  // Fetch native balance
  const nativeBalance = await fetchBalances(address);
  balances.push({
    value: BigInt(nativeBalance.spendable_balance),
    asset: { type: "native" },
  });

  // Discover token contracts from ERC20 transaction history
  // Use minHeight=0 to get all historical transactions for token discovery
  const erc20Txs = await fetchERC20TransactionsWithPages(address, 0);
  const contractAddresses = [...new Set(erc20Txs.map(tx => tx.contract_address.toLowerCase()))];

  // Fetch token balances in parallel for efficiency
  const tokenBalanceResults = await Promise.all(
    contractAddresses.map(async contract => {
      try {
        const tokenBalance = await fetchERC20TokenBalance(address, contract);
        return { contract, balance: tokenBalance, error: null };
      } catch (error) {
        // Log error but don't fail the entire balance fetch
        log("error", `Failed to fetch ERC20 balance for contract ${contract}`, error);
        return { contract, balance: "0", error };
      }
    }),
  );

  // Add non-zero token balances
  for (const { contract, balance } of tokenBalanceResults) {
    const value = BigInt(balance);
    if (value > 0n) {
      balances.push({
        value,
        asset: { type: "erc20", assetReference: contract },
      });
    }
  }

  return balances;
}
