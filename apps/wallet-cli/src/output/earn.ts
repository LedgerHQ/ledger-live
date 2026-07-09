/**
 * Earn human-output rendering.
 *
 * Pure presentation helpers for the human-facing `earn` commands, extracted from the large
 * CommandOutput module. These write directly to stdout (matching the rest of the human output
 * layer) and are only used by HumanCommandOutput — the JSON output path builds envelopes itself
 * and does not depend on this module.
 */

import { colors, writeStdout, hyperlink } from "../shared/ui";
import type { HumanFormatter } from "../wallet/formatter/human";
import type {
  EarnDepositResult,
  EarnPositionRow,
  EarnSolanaStake,
  EarnTransaction,
  EarnWithdrawResult,
  EarnYieldRow,
} from "../wallet/earn/types";

// ---------------------------------------------------------------------------
// Yields
// ---------------------------------------------------------------------------

function formatYieldRow(row: EarnYieldRow): string {
  const parts = [colors.bold(row.provider), colors.dim(row.network), row.depositToken];

  // Several vaults can share a deposit token (e.g. Morpho/AAVE/Compound USDC), so the token symbol
  // alone is ambiguous — surface the product name (e.g. "Morpho USDC") to tell them apart. Skip it
  // when it merely repeats the provider (Solana validator rows set both to the validator name).
  if (row.productName && row.productName !== row.provider) {
    parts.push(colors.bold(row.productName));
  }

  // `interestValue` is a decimal-string rate ("0.0569"). An empty string means "no data"
  // from the API (e.g. a validator with no Figment APY), so guard against it converting to a
  // misleading 0.00% via Number(""), and omit the rate entirely when it is unknown.
  const parsedRate = row.interestValue === "" ? Number.NaN : Number(row.interestValue);
  if (row.apy !== undefined) {
    parts.push(colors.green(`${row.apy.toFixed(2)}% APY`));
  } else if (Number.isFinite(parsedRate)) {
    parts.push(colors.green(`${(parsedRate * 100).toFixed(2)}% ${row.interestType}`));
  }

  if (row.category) parts.push(colors.dim(`(${row.category})`));
  if (row.commission !== undefined) parts.push(colors.dim(`${row.commission}% fee`));

  // The ETH vault id / Solana vote account is the value `earn deposit --product` expects.
  const product = row.validator ?? row.vaultId;
  if (product) parts.push(colors.dim(`→ --product ${product}`));

  // Provider rows are app-redirect flows the CLI cannot run: surface the deeplink to open in the
  // wallet instead (clickable in terminals that support OSC 8 hyperlinks, plain URL otherwise).
  if (row.deeplink) parts.push(colors.dim(`→ ${hyperlink(row.deeplink)}`));

  return parts.join("  ");
}

export function renderEarnYields(rows: EarnYieldRow[]): void {
  if (rows.length === 0) {
    writeStdout(colors.dim("No yield opportunities found."));
    return;
  }

  // Separate rows the CLI can deposit into directly (ETH vaults / SOL validators, via --product)
  // from the rest (grow/provider), which are acted on by opening their `ledgerlive://` deeplink.
  const targets = rows.filter(r => r.depositable);
  const info = rows.filter(r => !r.depositable);

  if (info.length > 0) {
    writeStdout(colors.bold("Yields — open in Ledger Live:"));
    for (const row of info) writeStdout(`  ${formatYieldRow(row)}`);
  }
  if (targets.length > 0) {
    if (info.length > 0) writeStdout("");
    writeStdout(
      colors.bold("Deposit targets — deposit from the CLI with `earn deposit --product <id>`:"),
    );
    for (const row of targets) writeStdout(`  ${formatYieldRow(row)}`);
  } else {
    // No CLI-depositable targets in this view (e.g. the no-network overview). The rows above can
    // still be opened via their deeplink; point the user at the per-network listing for --product.
    writeStdout("");
    writeStdout(
      colors.dim(
        "Open a row's link to deposit in Ledger Live, or run `earn yields --network ethereum` " +
          "(or solana) to list validators / vaults you can deposit straight from the CLI.",
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------

export async function renderEarnPositions(
  fmt: HumanFormatter,
  rows: EarnPositionRow[],
  stakes?: EarnSolanaStake[],
): Promise<void> {
  if (rows.length === 0 && (stakes === undefined || stakes.length === 0)) {
    writeStdout(colors.dim("No positions found for this account."));
    return;
  }
  for (const row of rows) {
    const stale = row.isStale ? colors.dim(" (stale)") : "";
    writeStdout(`${colors.bold(row.network)}  ${colors.dim(row.address)}${stale}`);
    if (Object.keys(row.data).length > 0) await printEarnPositionData(fmt, row.data);
  }

  // On-chain Solana stake accounts belong to the account, not a single view — print them once.
  if (stakes && stakes.length > 0) {
    writeStdout(colors.dim(`stake accounts (${stakes.length}):`));
    for (const s of stakes) {
      const parts = [
        `  ${colors.bold(s.state)}`,
        `${lamportsToSol(s.stakeBalance)} SOL`,
        colors.dim(`withdrawable ${lamportsToSol(s.withdrawable)} SOL`),
      ];
      if (s.validator) parts.push(colors.dim(`validator ${s.validator}`));
      writeStdout(parts.join("  "));
      writeStdout(`  ${colors.dim("→ --stake-account")} ${s.stakeAccount}`);
    }
  }
}

/**
 * Render a backend stake view (BatchedView) as human lines. The payload is backend-defined and
 * permissive (shape varies per network/provider), so we defensively pull the fields we know and
 * fall back to a JSON dump when no recognisable stake object is present — never hide data.
 */
async function printEarnPositionData(
  fmt: HumanFormatter,
  data: Record<string, unknown>,
): Promise<void> {
  const stakes = extractStakeViews(data);
  if (stakes.length === 0) {
    writeStdout(JSON.stringify(data, null, 2));
    return;
  }
  for (const stake of stakes) await printStakeView(fmt, stake);
}

async function printStakeView(fmt: HumanFormatter, stake: Record<string, unknown>): Promise<void> {
  const currency = asString(stake.currency);
  printStakeHeader(stake);
  await printStakedBalance(fmt, stake, currency);
  printStakeRate(stake);
  await printStakeRewards(fmt, stake, currency);
  printStakeProvider(stake);
}

/** Header: protocol name + status + commission mode (e.g. "gross"/"net"), whatever is present. */
function printStakeHeader(stake: Record<string, unknown>): void {
  const head: string[] = [];
  const protocol = asString(stake.protocol_name) ?? asString(stake.protocol);
  if (protocol) head.push(colors.bold(protocol));
  const status = asString(stake.status);
  if (status) head.push(colors.dim(status));
  const commission = asString(stake.commission);
  if (commission) head.push(colors.dim(`commission ${commission}`));
  if (head.length > 0) writeStdout(`  ${head.join("  ")}`);
}

async function printStakedBalance(
  fmt: HumanFormatter,
  stake: Record<string, unknown>,
  currency: string | undefined,
): Promise<void> {
  const stakedBalance = asString(stake.staked_balance);
  if (stakedBalance === undefined) return;
  const amount = await safeAmount(fmt, stakedBalance, currency);
  writeStdout(`  ${colors.dim("staked")} ${colors.green(amount)}`);
}

/** `interest.value` is a decimal-string rate ("0.0281…"), `type` its label ("NRR"/"APY"). */
function printStakeRate(stake: Record<string, unknown>): void {
  const interest = asRecord(stake.interest);
  if (!interest) return;
  const rate = toNumber(interest.value);
  if (rate === undefined) return;
  const type = asString(interest.type) ?? "";
  const rateLabel = `${(rate * 100).toFixed(2)}% ${type}`.trim();
  writeStdout(`  ${colors.dim("rate")} ${colors.green(rateLabel)}`);
}

async function printStakeRewards(
  fmt: HumanFormatter,
  stake: Record<string, unknown>,
  currency: string | undefined,
): Promise<void> {
  if (!Array.isArray(stake.rewards)) return;
  for (const entry of stake.rewards) {
    const reward = asRecord(entry);
    if (!reward) continue;
    const parts = [colors.dim("rewards")];
    const total = asString(reward.total);
    if (total !== undefined) {
      parts.push(colors.green(await safeAmount(fmt, total, asString(reward.currency) ?? currency)));
    }
    const apy = toNumber(reward.apy);
    if (apy !== undefined) parts.push(colors.dim(`apy ${(apy * 100).toFixed(2)}%`));
    if (parts.length > 1) writeStdout(`  ${parts.join("  ")}`);
  }
}

function printStakeProvider(stake: Record<string, unknown>): void {
  const provider = asString(stake.provider);
  if (!provider) return;
  const providerLabel = colors.dim(`provider ${provider}`);
  writeStdout(`  ${providerLabel}`);
}

/** Format a raw base-unit amount with its currency, falling back to the raw value if unknown. */
async function safeAmount(
  fmt: HumanFormatter,
  rawDecimal: string,
  assetId: string | undefined,
): Promise<string> {
  if (assetId) {
    try {
      return await fmt.formatAmount(rawDecimal, assetId);
    } catch {
      // Unknown currency/token id — fall through to the raw value rather than failing the render.
      const idSuffix = colors.dim(`(${assetId})`);
      return `${rawDecimal} ${idSuffix}`;
    }
  }
  return rawDecimal;
}

// ---------------------------------------------------------------------------
// Deposit / withdraw results
// ---------------------------------------------------------------------------

function printEarnTransactions(transactions: EarnTransaction[]): void {
  for (const tx of transactions) {
    const bits = [colors.bold(tx.kind)];
    if (tx.amount) bits.push(tx.amount);
    if (tx.to) bits.push(colors.dim(`to ${tx.to}`));
    if (tx.status) bits.push(colors.dim(`[${tx.status}]`));
    writeStdout(`  ${bits.join("  ")}`);
    if (tx.hash) writeStdout(`  hash: ${tx.hash}`);
  }
}

export function renderEarnDepositResult(result: EarnDepositResult): void {
  writeStdout(`${colors.bold("Deposit:")} ${result.amount}`);
  writeStdout(`${colors.bold("Network:")} ${result.network}`);
  if (result.product) writeStdout(`${colors.bold("Product:")} ${result.product}`);
  if (result.validator) writeStdout(`${colors.bold("Validator:")} ${result.validator}`);
  // result.status already encodes dry-run context (plain "dry-run", or a richer note when e.g. an
  // EVM deposit could not be simulated because an approve must be broadcast first).
  writeStdout(`${colors.bold("Status:")} ${result.status}`);
  printEarnTransactions(result.transactions);
}

export function renderEarnWithdrawResult(result: EarnWithdrawResult): void {
  if (result.amount) writeStdout(`${colors.bold("Withdraw:")} ${result.amount}`);
  writeStdout(`${colors.bold("Network:")} ${result.network}`);
  if (result.product) writeStdout(`${colors.bold("Product:")} ${result.product}`);
  if (result.stakeAccount) {
    writeStdout(`${colors.bold("Stake account:")} ${result.stakeAccount}`);
  }
  if (result.finalize) writeStdout(`${colors.bold("Finalize:")} true`);
  writeStdout(`${colors.bold("Status:")} ${result.dryRun ? "dry-run" : result.status}`);
  printEarnTransactions(result.transactions);
}

// ---------------------------------------------------------------------------
// BatchedView helpers (stake-view payloads are backend-defined / permissive)
// ---------------------------------------------------------------------------

/** Lamports → SOL (1e9), 4 dp, for readability. The stake-account addresses are what matters. */
function lamportsToSol(lamports: number): string {
  return (lamports / 1e9).toFixed(4);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/** Coerce a numeric-or-numeric-string field to a finite number, else undefined. */
function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/** Pull the stake object(s) out of a BatchedView: `stake` (singular) or `stakes` (array). */
function extractStakeViews(data: Record<string, unknown>): Record<string, unknown>[] {
  const single = asRecord(data.stake);
  if (single) return [single];
  if (Array.isArray(data.stakes)) {
    return data.stakes.map(asRecord).filter((s): s is Record<string, unknown> => s !== undefined);
  }
  return [];
}
