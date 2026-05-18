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
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets";
import { CliProcessExitError } from "./cli-process-exit-error";
import { type DeviceState, isTerminalDeviceState, renderDeviceState } from "./device/device-state";
import { WalletCliDeviceError } from "./device/wallet-cli-device-error";
import { HumanFormatter } from "./wallet/formatter/human";
import { JsonFormatter } from "./wallet/formatter/json";
import { makeEnvelope } from "./shared/response";
import { spinner, colors, writeStdout, writeStderr, isInteractive } from "./shared/ui";
import {
  formatSwapQuoteHuman,
  type SwapQuoteLine,
  type SwapQuoteProviderError,
} from "./commands/swap/quote-shared";
import { formatSwapStatusHuman, type SwapStatusLine } from "./commands/swap/status-shared";
import type { Balance, Operation, DiscoveredAccount, SendEvent } from "./wallet/models";
import type { SessionEntry } from "./session/session-store";
import type { SwapPayloadResponse } from "@ledgerhq/live-common/exchange/swap/types";

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
   * Human: exits immediately for WalletCliDeviceError, otherwise re-throws for Bunli.
   * Json: catches errors, writes a JSON error envelope, and exits with the mapped code.
   */
  run(fn: () => Promise<void>): Promise<void>;

  /**
   * Immediately handle an error.
   * Human: exits immediately for WalletCliDeviceError, otherwise throws it.
   * Json: writes error envelope + exits.
   */
  fail(e: unknown): never;

  // ---- Data output methods ----

  balances(items: Balance[]): Promise<void>;
  operations(items: Operation[], currencyId: string, nextCursor?: string): Promise<void>;
  /** Output a receive / fresh address. `verified` indicates whether the device attested it. */
  address(addr: string, verified: boolean): void;
  /**
   * Surface the derived address before device confirmation so the user (or an agent
   * watching the stream) can compare it with what the Ledger displays.
   * Human: stderr line. Json: NDJSON `pre-verify-address` event.
   */
  preVerifyAddress(addr: string): void;
  /** Output the result of a successful device genuine check. */
  genuineCheck(): void;

  /** Stream one discovered account (human: print immediately; json: buffer). */
  discoveredAccount(d: DiscoveredAccount): void;
  /** Signal end of discovery stream. Json: flush buffered accounts as envelope. Human: noop. */
  flushDiscovery(): void;
  /** Note that N new accounts were persisted to session (human: dim footer; json: noop). */
  sessionSaved(added: number): void;

  /** Output the result of a session reset (human: colored message; json: envelope with removed count). */
  sessionReset(count: number): void;
  /** Output session accounts (human: table or empty message; json: envelope with accounts array). */
  sessionView(accounts: readonly SessionEntry[]): void;

  /** Output a dry-run prepared transaction (human: formatted lines; json: envelope). */
  sendDryRun(p: { recipient: string; amount: string; fees: string }): void;
  /** Handle one send observable event (human: update active spinner; json: accumulate data). */
  sendEvent(event: SendEvent): void;
  /** Signal send stream complete. Json: write result envelope (account from ctx). Human: noop. */
  sendComplete(): void;

  /** Print swap quotes (human: formatted blocks; json: success envelope with `quotes`). */
  swapQuotes(args: { quotes: SwapQuoteLine[]; partialErrors: SwapQuoteProviderError[] }): void;
  /** Print swap status result. */
  swapStatus(status: SwapStatusLine): void;

  /**
   * No quotes returned while providers reported errors. Json: error envelope + exit 1.
   * Human: error lines + exit 1.
   */
  swapQuotesUnavailable(message: string, errors: SwapQuoteProviderError[]): never;

  /**
   * Emit an intermediate device-state transition (awaiting_approval, exchange_app_needed).
   * Human: update the active spinner with the canonical glyph + message.
   * Json: emit an NDJSON device-state event so non-interactive clients can react before the
   * final success/error envelope. Terminal failures are still surfaced through
   * WalletCliDeviceError handling in run()/fail().
   */
  deviceState(state: DeviceState): void;
  /** Print one progress line for swap execute long-running steps. */
  swapExecuteProgress(line: string): void;
  /** Print payload-only swap execute result. */
  swapExecutePayloadResult(args: {
    provider: string;
    amount: string;
    transactionId?: string;
    payload: SwapPayloadResponse;
  }): void;
  /** Print full-pipeline swap execute result. */
  swapExecuteFullResult(args: {
    from: string;
    to: string;
    provider: string;
    amount: string;
    transactionId: string;
    payload: SwapPayloadResponse;
    operationHash?: string;
    swapId?: string;
    amountExpectedTo?: string;
    magnitudeAwareRate?: string;
  }): void;
}

// ---------------------------------------------------------------------------
// HumanCommandOutput
// ---------------------------------------------------------------------------

class HumanCommandOutput implements CommandOutput {
  private _activeSpin: Spinner | null = null;

  constructor(private readonly _fmt: HumanFormatter) {}

  spin(text: string): Spinner | null {
    if (!isInteractive()) {
      writeStderr(text + "\n");
      return null;
    }
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
      if (err instanceof WalletCliDeviceError) {
        this._exitWithDeviceError(err);
      }
      const displayText = HumanCommandOutput._formatErrorForSpinner(err);
      this._activeSpin?.error(displayText);
      this._activeSpin = null;
      throw err;
    }
  }

  fail(e: unknown): never {
    if (e instanceof WalletCliDeviceError) {
      this._exitWithDeviceError(e);
    }
    throw e;
  }

  private static _formatErrorForSpinner(err: unknown): string {
    if (err instanceof WalletCliDeviceError) {
      const { glyph, message } = renderDeviceState(err.state);
      return `${glyph} ${message}`;
    }
    return HumanFormatter.formatError(err);
  }

  private _exitWithDeviceError(err: WalletCliDeviceError): never {
    const displayText = HumanCommandOutput._formatErrorForSpinner(err);
    if (isInteractive() && this._activeSpin) {
      this._activeSpin.error(displayText);
    } else {
      writeStderr(displayText + "\n");
    }
    this._activeSpin = null;
    throw new CliProcessExitError(err.exitCode);
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
      writeStderr("\n" + colors.dim(`nextCursor: ${nextCursor}`) + "\n");
    }
  }

  address(addr: string, verified: boolean): void {
    if (!verified) {
      writeStderr("Warning: address was NOT verified on device\n");
    }
    writeStdout(addr);
  }

  preVerifyAddress(addr: string): void {
    writeStderr(addr + "\n");
    writeStderr("Compare the address above with what's shown on your Ledger…\n");
  }

  genuineCheck(): void {
    if (this._activeSpin?.isSpinning) {
      this._activeSpin.success("Device is genuine");
      this._activeSpin = null;
      return;
    }
    writeStdout("Device is genuine");
  }

  discoveredAccount(d: DiscoveredAccount): void {
    this._activeSpin?.clear();
    writeStdout(this._fmt.formatDiscoveredAccount(d));
  }

  flushDiscovery(): void {
    /* noop */
  }

  sessionSaved(added: number): void {
    writeStdout(colors.dim(`  session: ${added} new account${added === 1 ? "" : "s"} saved`));
  }

  sessionReset(count: number): void {
    writeStdout(
      count === 0
        ? colors.dim("Session was already empty.")
        : `Removed ${colors.bold(String(count))} account${count === 1 ? "" : "s"} from session.`,
    );
  }

  sessionView(accounts: readonly SessionEntry[]): void {
    if (accounts.length === 0) {
      writeStdout(colors.dim("No accounts in session. Run `account discover` first."));
      return;
    }
    const maxLabel = Math.max(...accounts.map(e => e.label.length));
    for (const entry of accounts) {
      writeStdout(`${colors.bold(entry.label.padEnd(maxLabel))}  ${colors.dim(entry.descriptor)}`);
    }
  }

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
      case "device-signature-requested": {
        if (s) {
          const { glyph, message } = renderDeviceState({
            code: "awaiting_approval",
            reason: "sign",
          });
          s.text = `${glyph} ${message}`;
        }
        break;
      }
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

  sendComplete(): void {
    /* noop */
  }

  private _renderSwapProviderError(e: SwapQuoteProviderError): string {
    return colors.dim(`  ${e.provider} (${e.type}): ${e.code} - ${e.message}`);
  }

  private _printSwapProviderErrors(
    message: string,
    errors: SwapQuoteProviderError[],
    asFailure: boolean,
  ): void {
    if (isInteractive()) {
      const s = spinner("");
      if (asFailure) s.error(message);
      else s.error(colors.dim(message));
      for (const e of errors) {
        s.error(this._renderSwapProviderError(e));
      }
      return;
    }

    writeStderr(message + "\n");
    for (const e of errors) {
      writeStderr(this._renderSwapProviderError(e) + "\n");
    }
  }

  swapQuotes(args: { quotes: SwapQuoteLine[]; partialErrors: SwapQuoteProviderError[] }): void {
    for (const q of args.quotes) {
      writeStdout(`${formatSwapQuoteHuman(q)}\n`);
    }
    if (args.partialErrors.length > 0) {
      this._printSwapProviderErrors(
        `${args.partialErrors.length} provider(s) returned errors:`,
        args.partialErrors,
        false,
      );
    }
  }

  swapStatus(status: SwapStatusLine): void {
    writeStdout(formatSwapStatusHuman(status));
  }

  swapQuotesUnavailable(message: string, errors: SwapQuoteProviderError[]): never {
    this._printSwapProviderErrors(message, errors, true);
    throw new CliProcessExitError(1);
  }

  deviceState(state: DeviceState): void {
    if (isTerminalDeviceState(state)) {
      // Terminal states are surfaced via thrown WalletCliDeviceError; avoid double-render.
      return;
    }
    const { glyph, message } = renderDeviceState(state);
    const text = `${glyph} ${message}`;
    if (isInteractive()) {
      if (this._activeSpin) {
        this._activeSpin.text = text;
      } else {
        this.spin(text);
      }
    } else {
      writeStderr(text + "\n");
    }
  }
  swapExecuteProgress(line: string): void {
    if (this._activeSpin?.isSpinning) {
      this._activeSpin.success(line);
      this._activeSpin = null;
      return;
    }
    writeStderr(`${line}\n`);
  }

  swapExecutePayloadResult(args: {
    provider: string;
    amount: string;
    transactionId?: string;
    payload: SwapPayloadResponse;
  }): void {
    writeStdout(`${colors.bold("Provider:")} ${args.provider}\n`);
    writeStdout(`${colors.bold("Amount:")} ${args.amount}\n`);
    if (args.transactionId) {
      writeStdout(`${colors.bold("Device transaction id:")} ${args.transactionId}\n`);
    }
    writeStdout(`${colors.bold("Swap ID:")} ${args.payload.swapId ?? "(none)"}\n`);
    writeStdout(`${colors.bold("Payin address:")} ${args.payload.payinAddress}\n`);
  }

  swapExecuteFullResult(args: {
    from: string;
    to: string;
    provider: string;
    amount: string;
    transactionId: string;
    payload: SwapPayloadResponse;
    operationHash?: string;
    swapId?: string;
    amountExpectedTo?: string;
    magnitudeAwareRate?: string;
  }): void {
    writeStdout(`${colors.bold("From:")} ${args.from}\n`);
    writeStdout(`${colors.bold("To:")} ${args.to}\n`);
    this.swapExecutePayloadResult(args);
    if (args.amountExpectedTo) {
      writeStdout(
        `${colors.bold("Amount expected to (decoded payload):")} ${args.amountExpectedTo}\n`,
      );
    }
    if (args.operationHash) {
      writeStdout(`${colors.bold("Operation hash:")} ${args.operationHash}\n`);
    }
  }
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

  private _envelope(data: Record<string, unknown>): Record<string, unknown> {
    return makeEnvelope(this._ctx.command, this._ctx.network, data, this._ctx.account);
  }

  private _errorEnvelope(e: unknown): Record<string, unknown> {
    if (e instanceof WalletCliDeviceError) {
      const { message } = renderDeviceState(e.state);
      return {
        ok: false,
        error: {
          command: this._ctx.command,
          code: e.state.code,
          message,
        },
      };
    }
    return {
      ok: false,
      error: { command: this._ctx.command, message: HumanFormatter.formatError(e) },
    };
  }

  private _swapQuoteErrorEnvelope(
    message: string,
    errors: SwapQuoteProviderError[],
  ): Record<string, unknown> {
    return {
      ok: false,
      error: {
        command: this._ctx.command,
        code: "swap_quotes_unavailable",
        message,
        provider_errors: errors,
      },
    };
  }

  private _exitCode(e: unknown): number {
    return e instanceof WalletCliDeviceError ? e.exitCode : 1;
  }

  private _writeNdjson(value: unknown): void {
    writeStdout(JSON.stringify(value));
  }

  private _emitDeviceStateEvent(state: DeviceState): void {
    const { message } = renderDeviceState(state);
    this._writeNdjson({
      type: "device-state",
      command: this._ctx.command,
      network: this._ctx.network,
      ...(this._ctx.account == null ? {} : { account: this._ctx.account }),
      state,
      message,
    });
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
      if (e instanceof CliProcessExitError) throw e;
      this._writeNdjson(this._errorEnvelope(e));
      throw new CliProcessExitError(this._exitCode(e));
    }
  }

  fail(e: unknown): never {
    this._writeNdjson(this._errorEnvelope(e));
    throw new CliProcessExitError(this._exitCode(e));
  }

  async balances(items: Balance[]): Promise<void> {
    const balances = await this._jsonFmt.balances(items);
    this._writeNdjson(this._envelope({ balances }));
  }

  async operations(items: Operation[], currencyId: string, nextCursor?: string): Promise<void> {
    const operations = await this._jsonFmt.operations(items, currencyId, this._ctx.account ?? "");
    this._writeNdjson(this._envelope({ operations, nextCursor }));
  }

  address(addr: string, verified: boolean): void {
    this._writeNdjson(
      this._envelope({
        address: addr,
        verified,
        source: verified ? "device" : "software-derivation",
      }),
    );
  }

  preVerifyAddress(addr: string): void {
    this._writeNdjson({
      type: "pre-verify-address",
      command: this._ctx.command,
      network: this._ctx.network,
      ...(this._ctx.account == null ? {} : { account: this._ctx.account }),
      address: addr,
    });
  }

  genuineCheck(): void {
    this._writeNdjson(this._envelope({ genuine: true }));
  }

  discoveredAccount(d: DiscoveredAccount): void {
    this._discoveredAccounts.push(d);
  }

  flushDiscovery(): void {
    const accounts = JsonFormatter.discoveredAccounts(this._discoveredAccounts);
    this._writeNdjson(this._envelope({ accounts }));
  }

  sessionSaved(_added: number): void {
    /* noop */
  }

  sessionReset(count: number): void {
    this._writeNdjson(this._envelope({ removed: count }));
  }

  sessionView(accounts: readonly SessionEntry[]): void {
    this._writeNdjson(this._envelope({ accounts }));
  }

  sendDryRun(p: { recipient: string; amount: string; fees: string }): void {
    this._writeNdjson(
      this._envelope({ dry_run: true, recipient: p.recipient, amount: p.amount, fee: p.fees }),
    );
  }

  sendEvent(event: SendEvent): void {
    if (event.type === "prepared") {
      this._sendResult.recipient = event.recipient;
      this._sendResult.amount = event.amount;
      this._sendResult.fee = event.fees;
    } else if (event.type === "device-signature-requested") {
      this._emitDeviceStateEvent({ code: "awaiting_approval", reason: "sign" });
    } else if (event.type === "broadcasted") {
      this._sendResult.tx_hash = event.txHash;
    } else if (event.type === "dry-run") {
      this._sendResult.dry_run = true;
    }
  }

  sendComplete(): void {
    this._writeNdjson(this._envelope(this._sendResult));
  }

  deviceState(state: DeviceState): void {
    this._emitDeviceStateEvent(state);
  }

  swapQuotes(args: { quotes: SwapQuoteLine[]; partialErrors: SwapQuoteProviderError[] }): void {
    this._writeNdjson(
      this._envelope({
        quotes: args.quotes,
        ...(args.partialErrors.length === 0 ? {} : { provider_errors: args.partialErrors }),
      }),
    );
  }

  swapStatus(status: SwapStatusLine): void {
    this._writeNdjson(this._envelope(status));
  }

  swapQuotesUnavailable(message: string, errors: SwapQuoteProviderError[]): never {
    this._writeNdjson(this._swapQuoteErrorEnvelope(message, errors));
    throw new CliProcessExitError(1);
  }

  swapExecuteProgress(_line: string): void {
    // Keep JSON mode stdout clean and machine-readable.
  }

  swapExecutePayloadResult(args: {
    provider: string;
    amount: string;
    transactionId?: string;
    payload: SwapPayloadResponse;
  }): void {
    this._writeNdjson(
      this._envelope({
        provider: args.provider,
        amount: args.amount,
        transactionId: args.transactionId,
        payload: args.payload,
      }),
    );
  }

  swapExecuteFullResult(args: {
    from: string;
    to: string;
    provider: string;
    amount: string;
    transactionId: string;
    payload: SwapPayloadResponse;
    operationHash?: string;
    swapId?: string;
    amountExpectedTo?: string;
    magnitudeAwareRate?: string;
  }): void {
    this._writeNdjson(
      this._envelope({
        from: args.from,
        to: args.to,
        provider: args.provider,
        amount: args.amount,
        transactionId: args.transactionId,
        payload: args.payload,
        operationHash: args.operationHash,
        swapId: args.swapId,
        amountExpectedTo: args.amountExpectedTo,
        magnitudeAwareRate: args.magnitudeAwareRate,
      }),
    );
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createCommandOutput(format: "human" | "json", ctx: OutputContext): CommandOutput {
  const humanFmt = new HumanFormatter(getCryptoAssetsStore());
  if (format === "json") return new JsonCommandOutput(ctx, humanFmt);
  return new HumanCommandOutput(humanFmt);
}
