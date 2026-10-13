import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import type { SolanaCoinConfig } from "@ledgerhq/coin-solana/config";
import { getChainAPI } from "@ledgerhq/coin-solana/network/index";
import { getMaybeTokenMint } from "@ledgerhq/coin-solana/network/chain/web3";
import { endpointByCurrencyId } from "@ledgerhq/coin-solana/utils";
import { HEADER_X_LEDGER_CLIENT_VERSION } from "@shared/api-services";
import { getEnv } from "@shared/env";
import { z } from "zod";
import { resolveAccountDescriptor } from "../commands/inputs";
import { ledgerClientVersion } from "../shared/client-version";
import { WalletAdapter } from "../wallet";

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

export type SwapAsset = { id: string; ticker: string; decimals: number; contract?: string };

/** Resolves a swap asset by Ledger currency id: `ethereum` or an ERC-20 token on Ethereum mainnet.
 * `null` for anything else, including tokens on other chains. */
export async function findEthereumSwapAsset(id: string): Promise<SwapAsset | null> {
  if (id === "ethereum") {
    const eth = getCryptoCurrencyById("ethereum");
    return { id, ticker: eth.ticker, decimals: eth.units[0].magnitude };
  }
  const token = await getCryptoAssetsStore().findTokenById(id);
  if (token?.tokenType !== "erc20" || token.parentCurrencyId !== "ethereum") return null;
  return {
    id: token.id,
    ticker: token.ticker,
    decimals: token.units[0].magnitude,
    contract: token.contractAddress,
  };
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

/** A token a ticker can resolve to: `address` is its ERC-20 contract or SPL mint. */
export type TokenCandidate = { ticker: string; name: string; address: string };

const TOKEN_STANDARD = { ethereum: "erc20", solana: "spl" } as const;
const MAX_CANDIDATES = 20;

const CalTokenSchema = z.object({
  name: z.string(),
  ticker: z.string(),
  contract_address: z.string(),
  standard: z.string(),
  delisted: z.boolean(),
});

async function fetchCalTokens(network: string, ticker: string) {
  const url = new URL(`${getEnv("CAL_SERVICE_URL")}/v1/tokens`);
  url.searchParams.set("network", network);
  url.searchParams.set("ticker", ticker);
  url.searchParams.set("output", Object.keys(CalTokenSchema.shape).join(","));
  url.searchParams.set("limit", String(MAX_CANDIDATES));
  const response = await fetch(url, {
    headers: { Accept: "application/json", [HEADER_X_LEDGER_CLIENT_VERSION]: ledgerClientVersion },
  });
  if (!response.ok) {
    throw new Error(`CAL answered ${response.status} when looking up the ${ticker} ticker.`);
  }
  return z.array(CalTokenSchema).parse(await response.json());
}

/** The listed tokens CAL knows on the network's mainnet under `ticker`, ignoring case. CAL matches
 * tickers case-sensitively, so the uppercase spelling is looked up too. */
export async function findTokensByTicker(
  network: keyof typeof TOKEN_STANDARD,
  ticker: string,
): Promise<TokenCandidate[]> {
  const spellings = [...new Set([ticker, ticker.toUpperCase()])];
  const tokens = (await Promise.all(spellings.map(t => fetchCalTokens(network, t)))).flat();
  const candidates = new Map<string, TokenCandidate>();
  for (const token of tokens) {
    if (token.delisted || token.standard !== TOKEN_STANDARD[network]) continue;
    if (token.ticker.toUpperCase() !== ticker.toUpperCase()) continue;
    candidates.set(token.contract_address, {
      ticker: token.ticker,
      name: token.name,
      address: token.contract_address,
    });
  }
  return [...candidates.values()];
}

/** The CAL tokens a session account has a token account for. Syncs the account. */
export async function findAccountTokens(label: string): Promise<TokenCandidate[]> {
  const descriptor = await resolveAccountDescriptor(label);
  const balances = await new WalletAdapter().getAccountBalances(descriptor);
  const tokens = await Promise.all(
    balances
      .filter(({ assetId }) => assetId !== descriptor.currencyId)
      .map(({ assetId }) => getCryptoAssetsStore().findTokenById(assetId)),
  );
  return tokens.flatMap(token =>
    token ? [{ ticker: token.ticker, name: token.name, address: token.contractAddress }] : [],
  );
}
