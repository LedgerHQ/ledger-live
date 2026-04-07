import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export interface MonitorEntry {
  account: Account;
  threshold: string;
  tokenId?: string; // If set, extract balance from this token subAccount instead of the parent account balance
  name?: string; // Display name — defaults to account.accountName, required for token entries
  decimals: number; // Decimal magnitude for display (e.g. 8 for BTC, 18 for ETH, 6 for USDT)
  ticker: string;
}

export function unit(currencyId: string): Pick<MonitorEntry, "decimals" | "ticker"> {
  const { units } = getCryptoCurrencyById(currencyId);
  return { decimals: units[0].magnitude, ticker: units[0].code };
}

/** Groups entries by speculosApp name — one group per parallel worker. */
export function groupByApp(entries: MonitorEntry[]): Map<string, MonitorEntry[]> {
  const map = new Map<string, MonitorEntry[]>();
  for (const entry of entries) {
    const key = entry.account.currency.speculosApp.name;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }
  return map;
}
