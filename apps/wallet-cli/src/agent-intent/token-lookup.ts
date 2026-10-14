import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import type { SolanaCoinConfig } from "@ledgerhq/coin-solana/config";
import { getChainAPI } from "@ledgerhq/coin-solana/network/index";
import { getMaybeTokenMint } from "@ledgerhq/coin-solana/network/chain/web3";
import { endpointByCurrencyId } from "@ledgerhq/coin-solana/utils";

export type EthereumToken = { ticker: string; decimals: number; contract: string };
export type SolanaToken = { ticker: string; decimals: number; mint: string };

/** Resolves an ERC-20 contract on Ethereum mainnet through CAL. `null` when CAL doesn't know it on
 * that network (which is also how a contract from another chain is rejected) or it isn't ERC-20. */
export async function findEthereumToken(contract: string): Promise<EthereumToken | null> {
  const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(contract, "ethereum");
  if (token?.tokenType !== "erc20") return null;
  return {
    ticker: token.ticker,
    decimals: token.units[0].magnitude,
    contract: token.contractAddress,
  };
}

export type SwapAsset = { id: string; ticker: string; decimals: number };

/** Resolves a swap asset by Ledger currency id: `ethereum` or an ERC-20 token on Ethereum mainnet.
 * `null` for anything else, including tokens on other chains. */
export async function findEthereumSwapAsset(id: string): Promise<SwapAsset | null> {
  if (id === "ethereum") {
    const eth = getCryptoCurrencyById("ethereum");
    return { id, ticker: eth.ticker, decimals: eth.units[0].magnitude };
  }
  const token = await getCryptoAssetsStore().findTokenById(id);
  if (token?.tokenType !== "erc20" || token.parentCurrencyId !== "ethereum") return null;
  return { id: token.id, ticker: token.ticker, decimals: token.units[0].magnitude };
}

/** Resolves an SPL mint on Solana mainnet through CAL. `null` when CAL doesn't know it there. */
export async function findSolanaToken(mint: string): Promise<SolanaToken | null> {
  const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(mint, "solana");
  if (token?.tokenType !== "spl") return null;
  return {
    ticker: token.ticker,
    decimals: token.units[0].magnitude,
    mint: token.contractAddress,
  };
}

/** The mint's token program (`spl-token` or `spl-token-2022`) read on chain: CAL types both "spl". */
export async function findSolanaMintProgram(mint: string): Promise<string | undefined> {
  const config = getCurrencyConfiguration<SolanaCoinConfig>("solana");
  const api = getChainAPI({ endpoint: endpointByCurrencyId(config, "solana") });
  const mintAccount = await getMaybeTokenMint(mint, api);
  if (mintAccount instanceof Error) throw mintAccount;
  return mintAccount?.onChainAcc.data.program;
}
