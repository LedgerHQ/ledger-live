import axios from "axios";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";
import { listTokens } from "@ledgerhq/cryptoassets/tokens";

const baseUrl = process.env.COUNTERVALUES_API || "https://countervalues.live.ledger.com";

let cachedIds: string[] | null = null;
let inflightIds: Promise<string[]> | null = null;
let idToTicker: Map<string, string> | null = null;

export async function getTopCurrenciesByMarketCap(count?: number): Promise<string[]> {
  const sortedIds = await fetchSortedCurrencyIds();
  const tickers: string[] = [];
  const seen = new Set<string>();
  const limit = count ?? Number.MAX_SAFE_INTEGER;

  for (const id of sortedIds) {
    const ticker = mapIdToTicker(id);
    if (!ticker) continue;
    const displayTicker = normalizeTicker(ticker);
    if (seen.has(displayTicker)) continue;
    seen.add(displayTicker);
    tickers.push(displayTicker);
    if (tickers.length >= limit) break;
  }
  return tickers;
}

async function fetchSortedCurrencyIds(): Promise<string[]> {
  if (cachedIds) return cachedIds;
  if (inflightIds) return inflightIds;

  inflightIds = (async () => {
    const { data } = await axios.get<string[]>(`${baseUrl}/v3/supported/crypto`, {
      timeout: 10_000,
    });
    cachedIds = data;
    inflightIds = null;
    return data;
  })();

  return inflightIds;
}

function mapIdToTicker(currencyId: string): string | null {
  if (!idToTicker) {
    const map = new Map<string, string>();
    for (const c of listCryptoCurrencies()) map.set(c.id, c.ticker);
    for (const t of listTokens()) map.set(t.id, t.ticker);
    map.set("binancecoin", "BNB");
    idToTicker = map;
  }
  return idToTicker.get(currencyId) ?? null;
}

function normalizeTicker(ticker: string): string {
  const t = ticker.toUpperCase();
  if (t.endsWith(".E")) return t.slice(0, -2);
  return t;
}
