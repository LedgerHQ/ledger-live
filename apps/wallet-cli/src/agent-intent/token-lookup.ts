import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";

export type EthereumToken = { ticker: string; decimals: number; contract: string };

/** Resolves an ERC-20 contract on Ethereum mainnet through CAL. `null` when CAL doesn't know it on
 * that network — which is also how a contract from another chain is rejected. */
export async function findEthereumToken(contract: string): Promise<EthereumToken | null> {
  const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(contract, "ethereum");
  if (!token) return null;
  return {
    ticker: token.ticker,
    decimals: token.units[0].magnitude,
    contract: token.contractAddress,
  };
}
