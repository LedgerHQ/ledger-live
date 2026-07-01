import type { Balance } from "@ledgerhq/coin-module-framework/api/index";
import { log } from "@ledgerhq/logs";
import { fetchBalances, fetchERC20TokenBalance } from "../../network/api";
import { convertAddressFilToEth } from "../../network/addresses";

// getBalance returns the native FIL balance plus any ERC-20 token balances for
// contracts passed in tokenContracts. The caller (e.g., the Alpaca generic sync
// layer) is responsible for supplying the tracked token contract addresses.
//
// Zero-balance token entries are included explicitly so callers can distinguish
// "zero" from "not yet synced" (specialized task constraint).
export async function getBalance(
  address: string,
  tokenContracts: string[] = [],
): Promise<Balance[]> {
  const balanceResponse = await fetchBalances(address);

  const nativeBalance: Balance = {
    value: BigInt(balanceResponse.total_balance),
    asset: { type: "native" },
    // Use ?? "0" fallback before BigInt conversion — locked_balance may be absent
    locked: BigInt(balanceResponse.locked_balance ?? "0"),
  };

  const balances: Balance[] = [nativeBalance];

  if (tokenContracts.length === 0) {
    return balances;
  }

  // Convert the FIL address to its Ethereum-compatible form for ERC-20 queries
  let ethAddr: string | null = null;
  try {
    ethAddr = convertAddressFilToEth(address);
  } catch {
    log("debug", `[getBalance] address not convertible to eth address: ${address}`);
    // Cannot fetch ERC-20 balances without an ETH-compatible address — return native only
    return balances;
  }

  for (const rawContract of tokenContracts) {
    const contractAddr = rawContract.toLowerCase();
    try {
      const rawBalance = await fetchERC20TokenBalance(ethAddr, contractAddr);
      balances.push({
        value: BigInt(rawBalance),
        asset: { type: "erc20", assetReference: contractAddr },
      });
    } catch (e) {
      log("error", `[getBalance] failed to fetch ERC20 balance for ${contractAddr}`, e);
      // Include zero entry even on error — absence would be misread as "not tracked"
      balances.push({
        value: 0n,
        asset: { type: "erc20", assetReference: contractAddr },
      });
    }
  }

  return balances;
}
