import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import type { SolanaCoinConfig } from "@ledgerhq/coin-solana/config";
import { getChainAPI } from "@ledgerhq/coin-solana/network/index";
import { getMaybeTokenMint } from "@ledgerhq/coin-solana/network/chain/web3";
import { chainConfigFrom } from "@ledgerhq/coin-solana/utils";
import { HEADER_X_LEDGER_CLIENT_VERSION } from "@shared/api-services";
import BigNumber from "bignumber.js";
import { z } from "zod";
import { toV0, type AccountDescriptorV1 } from "../shared/accountDescriptor";
import { calApiConfig } from "../shared/cal-config";
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

/** Resolves a swap asset by its ERC-20 contract on Ethereum mainnet. `null` when CAL doesn't know
 * it there. */
export async function findEthereumSwapAssetByContract(contract: string): Promise<SwapAsset | null> {
  const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(contract, "ethereum");
  return token ? findEthereumSwapAsset(token.id) : null;
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
  const api = getChainAPI(chainConfigFrom(config));
  const mintAccount = await getMaybeTokenMint(mint, api);
  if (mintAccount instanceof Error) throw mintAccount;
  return mintAccount?.onChainAcc.data.program;
}

export function sameTicker(a: string, b: string): boolean {
  return a.toUpperCase() === b.toUpperCase();
}

function isMixedCase(ticker: string): boolean {
  return ticker !== ticker.toUpperCase() && ticker !== ticker.toLowerCase();
}

export function tokensWithTicker<T extends { ticker: string }>(tokens: T[], ticker: string): T[] {
  const matches = tokens.filter(token => sameTicker(token.ticker, ticker));
  if (!isMixedCase(ticker)) return matches;
  const exact = matches.filter(token => token.ticker === ticker);
  return exact.length > 0 ? exact : matches;
}

export type TokenCandidate = { id: string; ticker: string; name: string; address: string };

const TOKEN_STANDARD = { ethereum: "erc20", solana: "spl" } as const;
const MAX_CANDIDATES = 20;
const SEARCH_LIMIT = 1000;
const CAL_TIMEOUT_MS = 10_000;

const CalTokensSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    ticker: z.string(),
    contract_address: z.string(),
  }),
);

async function fetchCalTokens(
  network: keyof typeof TOKEN_STANDARD,
  filter: "ticker" | "search",
  ticker: string,
) {
  const url = new URL(`${calApiConfig.calServiceUrl}/v1/tokens`);
  url.searchParams.set("network", network);
  url.searchParams.set(filter, ticker);
  url.searchParams.set("standard", TOKEN_STANDARD[network]);
  url.searchParams.set("delisted", "false");
  url.searchParams.set("output", "id,name,ticker,contract_address");
  url.searchParams.set("limit", String(filter === "search" ? SEARCH_LIMIT : MAX_CANDIDATES));
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      [HEADER_X_LEDGER_CLIENT_VERSION]: calApiConfig.ledgerClientVersion,
    },
    signal: AbortSignal.timeout(CAL_TIMEOUT_MS),
  }).catch((error: unknown) => {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`CAL didn't answer the ${ticker} ticker lookup: ${reason}`, { cause: error });
  });
  if (!response.ok) {
    throw new Error(`CAL answered ${response.status} when looking up the ${ticker} ticker.`);
  }
  const tokens = CalTokensSchema.safeParse(await response.json().catch(() => undefined));
  if (!tokens.success) {
    throw new Error(`CAL sent an unexpected response when looking up the ${ticker} ticker.`);
  }
  return tokens.data;
}

async function searchCalTokens(network: keyof typeof TOKEN_STANDARD, ticker: string) {
  if (!ticker.trim()) return [];
  return fetchCalTokens(network, "search", ticker).catch(() => undefined);
}

type TickerLookup = { tokens: TokenCandidate[]; complete: boolean };

/** CAL's `ticker` filter is case-sensitive and its `search` is fuzzy, so this looks up the ticker as
 * typed and uppercase, and searches for its other spellings (`mETH` for `METH`). */
export async function findTokensByTicker(
  network: keyof typeof TOKEN_STANDARD,
  ticker: string,
): Promise<TickerLookup> {
  const spellings = [...new Set([ticker, ticker.toUpperCase()])];
  const [exact, searched] = await Promise.all([
    Promise.all(spellings.map(spelling => fetchCalTokens(network, "ticker", spelling))),
    searchCalTokens(network, ticker),
  ]);
  const candidates = new Map<string, TokenCandidate>();
  for (const token of tokensWithTicker([...exact.flat(), ...(searched ?? [])], ticker)) {
    candidates.set(token.contract_address, {
      id: token.id,
      ticker: token.ticker,
      name: token.name,
      address: token.contract_address,
    });
  }
  const complete =
    exact.every(tokens => tokens.length < MAX_CANDIDATES) &&
    searched !== undefined &&
    searched.length < SEARCH_LIMIT;
  return { tokens: [...candidates.values()], complete };
}

export async function findAccountTokens(
  account: AccountDescriptorV1,
): Promise<{ tokens: TokenCandidate[]; skippedTokenIds: string[] }> {
  const { balances, skippedTokenIds } = await new WalletAdapter().getAccountBalances(toV0(account));
  const tokens = balances.flatMap(b =>
    b.kind === "token" && !b.token.delisted && new BigNumber(b.balance).gt(0)
      ? [
          {
            id: b.token.id,
            ticker: b.token.ticker,
            name: b.token.name,
            address: b.token.contractAddress,
          },
        ]
      : [],
  );
  return { tokens, skippedTokenIds };
}
