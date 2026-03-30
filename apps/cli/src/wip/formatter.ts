import { BigNumber } from "bignumber.js";
import { findCryptoCurrencyById, formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { decodeAccountId } from "@ledgerhq/live-common/account/index";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import type { AccountDescriptor, Balance, Operation } from "./models";

export type Formatter<T> = (value: T) => Promise<string>;

export class WalletFormatter {
  constructor(private readonly cryptoAssetsStore: CryptoAssetsStore) {}

  private async resolveUnit(assetId: string): Promise<Unit> {
    const currency = findCryptoCurrencyById(assetId);
    if (currency) return currency.units[0];
    const token = await this.cryptoAssetsStore.findTokenById(assetId);
    if (token) return token.units[0];
    throw new Error(`Unknown currency or token: ${assetId}`);
  }

  private async formatAmount(rawDecimal: string, assetId: string): Promise<string> {
    const unit = await this.resolveUnit(assetId);
    return formatCurrencyUnit(unit, new BigNumber(rawDecimal), { showCode: true });
  }

  formatAccountDescriptor(d: AccountDescriptor): string {
    const mode = d.derivationMode ? ` (${d.derivationMode})` : "";
    return `${d.currencyId} account #${d.index}${mode}  ${d.freshAddress}`;
  }

  async formatBalance(b: Balance): Promise<string> {
    return this.formatAmount(b.balance, b.assetId);
  }

  async formatOperation(op: Operation): Promise<string> {
    const { currencyId } = decodeAccountId(op.accountId);
    const unit = await this.resolveUnit(currencyId);
    const fmt = (raw: string) => formatCurrencyUnit(unit, new BigNumber(raw), { showCode: true });
    const [value, fee] = [fmt(op.value), fmt(op.fee)];
    const hash = `${op.hash.slice(0, 8)}…`;
    const date = new Date(op.date).toLocaleString();
    const block = op.blockHeight != null ? `#${op.blockHeight}` : "pending";
    const from = truncateAddr(op.senders[0]);
    const to = truncateAddr(op.recipients[0]);
    return `[${op.type.padEnd(12)}]  ${hash}  ${value}  fee ${fee}  ${from} → ${to}  ${date}  ${block}`;
  }

  async formatList<T>(items: T[], fmt: Formatter<T>): Promise<string> {
    return (await Promise.all(items.map(fmt))).join("\n");
  }
}

function truncateAddr(addr: string | undefined, n = 8): string {
  if (!addr) return "—";
  return addr.length > n * 2 + 1 ? `${addr.slice(0, n)}…${addr.slice(-n)}` : addr;
}
