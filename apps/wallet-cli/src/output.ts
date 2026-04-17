/**
 * CommandOutput — unified output abstraction for all wallet-cli commands.
 *
 * Instead of scattering `if (isHuman)` branches across every command handler, each handler
 * creates one CommandOutput instance and calls semantic methods. The implementation (Human or
 * Json) handles formatting, spinning, envelope building, and error exit transparently.
 *
 * Factory: createCommandOutput(format, ctx)
 */

import type { Spinner } from "yocto-spinner";
import { writeSync } from "node:fs";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets";
import { HumanFormatter } from "./wallet/formatter/human";
import { JsonFormatter } from "./wallet/formatter/json";
import { makeEnvelope } from "./shared/response";
import { spinner, colors, writeStdout } from "./shared/ui";
import type { Balance, Operation, DiscoveredAccount, SendEvent } from "./wallet/models";

// ---------------------------------------------------------------------------
// Context & interface
// ---------------------------------------------------------------------------

export type OutputContext = {
  /** Command name as it appears in the JSON envelope, e.g. "balances", "account discover". */
  command: string;
  /** Network string, e.g. "bitcoin", "ethereum:goerli". */
  network: string;
  /** Account identifier included in JSON envelopes (optional — not all commands have one). */
  account?: string;
};

export interface CommandOutput {
  /** Wrap an async operation with an activity indicator (spinner in human mode, silent in json). */
  withActivity<T>(loadingText: string, doneText: string, fn: () => Promise<T>): Promise<T>;

  /**
   * Create a spinner (human mode) or return null (json mode).
   * The created spinner is stored as the active spinner and used by sendEvent.
   */
  spin(text: string): Spinner | null;

  /**
   * Error-handling boundary for the command handler body.
   * Human: re-throws errors (Bunli handles display).
   * Json: catches errors, writes a JSON error envelope, and exits with code 1.
   */
  run(fn: () => Promise<void>): Promise<void>;

  /**
   * Immediately handle an error.
   * Human: throws it. Json: writes error envelope + exits.
   */
  fail(e: unknown): never;

  // ---- Data output methods ----

  balances(items: Balance[]): Promise<void>;
  operations(items: Operation[], currencyId: string, nextCursor?: string): Promise<void>;
  /** Output a receive / fresh address. */
  address(addr: string): void;

  /** Stream one discovered account (human: print immediately; json: buffer). */
  discoveredAccount(d: DiscoveredAccount): void;
  /** Signal end of discovery stream. Json: flush buffered accounts as envelope. Human: noop. */
  flushDiscovery(): void;

  /** Output a dry-run prepared transaction (human: formatted lines; json: envelope). */
  sendDryRun(p: { recipient: string; amount: string; fees: string }): void;
  /** Handle one send observable event (human: update active spinner; json: accumulate data). */
  sendEvent(event: SendEvent): void;
  /** Signal send stream complete. Json: write result envelope (account from ctx). Human: noop. */
  sendComplete(): void;
}

// ---------------------------------------------------------------------------
// HumanCommandOutput
// ---------------------------------------------------------------------------

class HumanCommandOutput implements CommandOutput {
  private _activeSpin: Spinner | null = null;

  constructor(private readonly _fmt: HumanFormatter) {}

  spin(text: string): Spinner | null {
    const s = spinner(text);
    this._activeSpin = s;
    return s;
  }

  async withActivity<T>(loadingText: string, doneText: string, fn: () => Promise<T>): Promise<T> {
    const s = this.spin(loadingText);
    try {
      const result = await fn();
      s?.success(doneText);
      return result;
    } catch (err) {
      s?.error("Failed");
      throw err;
    }
  }

  async run(fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (err) {
      this._activeSpin?.error(HumanFormatter.formatError(err));
      this._activeSpin = null;
      throw err;
    }
  }

  fail(e: unknown): never {
    throw e;
  }

  async balances(items: Balance[]): Promise<void> {
    for (const b of items) {
      writeStdout(await this._fmt.formatBalance(b));
    }
  }

  async operations(items: Operation[], currencyId: string, nextCursor?: string): Promise<void> {
    for (const op of items) {
      const line = await this._fmt.formatOperation(op, currencyId);
      writeStdout(op.parentId ? `  ${line}` : line);
    }
    if (nextCursor) {
      process.stderr.write("\n" + colors.dim(`nextCursor: ${nextCursor}`) + "\n");
    }
  }

  address(addr: string): void {
    writeStdout(addr);
  }

  discoveredAccount(d: DiscoveredAccount): void {
    this._activeSpin?.clear();
    writeStdout(this._fmt.formatDiscoveredAccount(d));
  }

  flushDiscovery(): void { /* noop */ }

  private _printTransactionLines(p: { recipient: string; amount: string; fees: string }): void {
    writeStdout(`  To:     ${p.recipient}`);
    writeStdout(`  Amount: ${colors.bold(colors.green(p.amount))}`);
    writeStdout(`  Fees:   ${colors.dim(p.fees)}`);
  }

  sendDryRun(p: { recipient: string; amount: string; fees: string }): void {
    this._printTransactionLines(p);
  }

  sendEvent(event: SendEvent): void {
    const s = this._activeSpin;
    switch (event.type) {
      case "prepared":
        s?.clear();
        this._printTransactionLines(event);
        if (s) s.text = "Confirm transaction on device…";
        break;
      case "device-streaming":
        if (s) s.text = `Streaming to device… ${Math.round(event.progress * 100)}%`;
        break;
      case "device-signature-requested":
        if (s) s.text = "Please confirm on device…";
        break;
      case "device-signature-granted":
        if (s) s.text = "Signed, broadcasting…";
        break;
      case "dry-run":
        s?.success("Dry run complete (transaction not broadcasted)");
        break;
      case "broadcasted":
        s?.success(`Broadcasted  ${colors.dim(event.txHash)}`);
        break;
    }
  }

  sendComplete(): void { /* noop */ }
}

// ---------------------------------------------------------------------------
// JsonCommandOutput
// ---------------------------------------------------------------------------

class JsonCommandOutput implements CommandOutput {
  private readonly _jsonFmt: JsonFormatter;
  private readonly _discoveredAccounts: DiscoveredAccount[] = [];
  private readonly _sendResult: Record<string, unknown> = {};

  constructor(
    private readonly _ctx: OutputContext,
    fmt: HumanFormatter,
  ) {
    this._jsonFmt = new JsonFormatter(fmt);
  }

  private _envelope(data: Record<string, unknown>): string {
    return JSON.stringify(makeEnvelope(this._ctx.command, this._ctx.network, data, this._ctx.account), null, 2);
  }

  private _errorEnvelope(e: unknown): string {
    return JSON.stringify(
      { ok: false, error: { command: this._ctx.command, message: HumanFormatter.formatError(e) } },
      null,
      2,
    );
  }

  spin(_text: string): null {
    return null;
  }

  async withActivity<T>(_loadingText: string, _doneText: string, fn: () => Promise<T>): Promise<T> {
    return fn();
  }

  async run(fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (e) {
      // Bun.spawn on Linux does not reliably capture fd 2 (stderr) from subprocesses.
      // writeSync(1, ...) is a synchronous POSIX syscall — immune to process.exit() buffer drain.
      writeSync(1, this._errorEnvelope(e) + "\n");
      process.exit(1);
    }
  }

  fail(e: unknown): never {
    writeSync(1, this._errorEnvelope(e) + "\n");
    process.exit(1);
  }

  async balances(items: Balance[]): Promise<void> {
    const balances = await this._jsonFmt.balances(items);
    writeStdout(this._envelope({ balances }));
  }

  async operations(items: Operation[], currencyId: string, nextCursor?: string): Promise<void> {
    const operations = await this._jsonFmt.operations(items, currencyId, this._ctx.account ?? "");
    writeStdout(this._envelope({ operations, nextCursor }));
  }

  address(addr: string): void {
    writeStdout(this._envelope({ address: addr }));
  }

  discoveredAccount(d: DiscoveredAccount): void {
    this._discoveredAccounts.push(d);
  }

  flushDiscovery(): void {
    const accounts = JsonFormatter.discoveredAccounts(this._discoveredAccounts);
    writeStdout(this._envelope({ accounts }));
  }

  sendDryRun(p: { recipient: string; amount: string; fees: string }): void {
    writeStdout(this._envelope({ dry_run: true, recipient: p.recipient, amount: p.amount, fee: p.fees }));
  }

  sendEvent(event: SendEvent): void {
    if (event.type === "prepared") {
      this._sendResult.recipient = event.recipient;
      this._sendResult.amount = event.amount;
      this._sendResult.fee = event.fees;
    } else if (event.type === "broadcasted") {
      this._sendResult.tx_hash = event.txHash;
    } else if (event.type === "dry-run") {
      this._sendResult.dry_run = true;
    }
  }

  sendComplete(): void {
    writeStdout(this._envelope(this._sendResult));
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createCommandOutput(
  format: "human" | "json",
  ctx: OutputContext,
): CommandOutput {
  const humanFmt = new HumanFormatter(getCryptoAssetsStore());
  if (format === "json") return new JsonCommandOutput(ctx, humanFmt);
  return new HumanCommandOutput(humanFmt);
}

