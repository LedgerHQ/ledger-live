import { BigNumber } from "bignumber.js";
import { findCryptoCurrencyById, formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type { CryptoAssetsStore, OperationType } from "@ledgerhq/types-live";
import { colors } from "../../shared/ui";
import { serializeV1 } from "../../shared/accountDescriptor";
import type { AccountDescriptor, Balance, Operation, DiscoveredAccount } from "../models";

const TYPE_COLORS: Partial<Record<OperationType, (s: string) => string>> = {
  IN: colors.green,
  OUT: colors.red,
  FEES: colors.yellow,
  REWARD: colors.cyan,
};

export class HumanFormatter {
  private readonly unitCache = new Map<string, Unit>();

  constructor(private readonly cryptoAssetsStore: CryptoAssetsStore) {}

  private async resolveUnit(assetId: string): Promise<Unit> {
    const cached = this.unitCache.get(assetId);
    if (cached) return cached;
    const currency = findCryptoCurrencyById(assetId);
    const unit =
      currency?.units[0] ?? (await this.cryptoAssetsStore.findTokenById(assetId))?.units[0];
    if (!unit) throw new Error(`Unknown currency or token: ${assetId}`);
    this.unitCache.set(assetId, unit);
    return unit;
  }

  async formatAmount(rawDecimal: string, assetId: string): Promise<string> {
    const unit = await this.resolveUnit(assetId);
    return formatCurrencyUnit(unit, new BigNumber(rawDecimal), { showCode: true });
  }

  /** @deprecated Use formatDiscoveredAccount — kept for any internal callers during migration. */
  formatAccountDescriptor(d: AccountDescriptor): string {
    const mode = d.derivationMode ? colors.dim(` (${d.derivationMode})`) : "";
    const label = `${colors.bold(colors.cyan(d.currencyId))} account ${colors.bold(`#${d.index}`)}${mode}  ${d.freshAddress}`;
    return `${label}\n  ${colors.dim(`${d.id}:${d.index}`)}`;
  }

  formatDiscoveredAccount(d: DiscoveredAccount): string {
    const { descriptor, freshAddress } = d;
    const v1str = serializeV1(descriptor);
    const networkStr = `${descriptor.network.name}:${descriptor.network.env}`;
    const rawIndex = descriptor.path.split("/")[3]?.replace(/[h']/g, "") ?? "?";
    const typeLabel = colors.dim(`(${descriptor.type})`);
    const label = `${colors.bold(colors.cyan(networkStr))} account ${colors.bold(`#${rawIndex}`)} ${typeLabel}  ${freshAddress}`;
    return `${label}\n  ${colors.dim(v1str)}`;
  }

  async formatBalance(b: Balance): Promise<string> {
    const amount = await this.formatAmount(b.balance, b.assetId);
    return b.balance === "0" ? colors.dim(amount) : colors.green(amount);
  }

  static formatError(e: unknown): string {
    if (e instanceof Error) return e.message;
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }

  async formatOperation(op: Operation, nativeCurrencyId: string): Promise<string> {
    const [valueUnit, feeUnit] = await Promise.all([
      this.resolveUnit(op.assetId),
      this.resolveUnit(nativeCurrencyId),
    ]);
    const value = formatCurrencyUnit(valueUnit, new BigNumber(op.value), { showCode: true });
    const fee = formatCurrencyUnit(feeUnit, new BigNumber(op.fee), { showCode: true });
    const date = colors.dim(formatDate(new Date(op.date)));
    const block =
      op.blockHeight != null ? colors.dim(`#${op.blockHeight}`) : colors.yellow("pending");
    const from = op.senders[0] ?? "—";
    const to = op.recipients[0] ?? "—";
    const colorType = TYPE_COLORS[op.type] ?? colors.white;
    const type = colorType(op.type.padEnd(6));
    return `${date}  ${type}  ${colors.bold(value)}   ${from} → ${to}   ${colors.dim(`fee ${fee}`)}   ${block}   ${colors.dim(op.hash)}`;
  }
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
