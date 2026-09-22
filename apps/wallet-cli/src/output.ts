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
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
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
import {
  renderEarnYields,
  renderEarnPositions,
  renderEarnDepositResult,
  renderEarnWithdrawResult,
} from "./output/earn";
import type { Balance, Operation, DiscoveredAccount, SendEvent, TokenInfo } from "./wallet/models";
import { APP_NAME } from "./session/session-store";
import type { SessionEntry, AgentIntentProfileMeta } from "./session/session-store";
import { redactUrlCredentials, agentIntentProfileStatus } from "./agent-intent/profile-format";
import { formatAgentPublicKeyFingerprint } from "@ledgerhq/agent-intent-sdk";
import type { LedgerSyncImportReport } from "./ledger-sync/cloud-sync-accounts";
import type { SwapPayloadResponse } from "@ledgerhq/live-common/exchange/swap/types";
import type {
  EarnDepositResult,
  EarnPositionRow,
  EarnSolanaStake,
  EarnWithdrawResult,
  EarnYieldRow,
} from "./wallet/earn/types";

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

/** Outcome of `ring destroy`, shared by the interface, both output impls, and the producer. */
export type RingDestroyResult = {
  remoteSucceeded: boolean;
  trustchainDestroyed: boolean;
  localWiped: boolean;
  // Remote teardown hit TrustchainEjected: this member is no longer on the ring (removed, or the ring
  // was destroyed remotely), so the remote is already gone. Only meaningful alongside remoteSucceeded.
  memberEjected?: boolean;
};

/** Outcome of `ledger-sync destroy` (NTTVS-728) — same shape as RingDestroyResult, kept separate
 * because the two applications (`ring` vs Ledger Sync) must never be conflated. */
export type LedgerSyncDestroyResult = RingDestroyResult;

/**
 * `ring destroy` and `ledger-sync destroy` reduce to the exact same 5-way outcome (only the wording
 * differs per application) — modeled as a state, not scattered booleans, so a future 6th case is a
 * compile error at every `switch` below instead of a silently-missed `if` branch.
 */
type DestroyOutcome = "destroyed" | "ejected" | "deactivated" | "local-wiped-only" | "nothing-done";

function destroyOutcome({
  remoteSucceeded,
  trustchainDestroyed,
  localWiped,
  memberEjected,
}: RingDestroyResult): DestroyOutcome {
  if (trustchainDestroyed) return "destroyed";
  if (remoteSucceeded && memberEjected) return "ejected";
  if (remoteSucceeded) return "deactivated";
  if (localWiped) return "local-wiped-only";
  return "nothing-done";
}

/** Json envelope fields for a destroy result — identical for `ring` and Ledger Sync. */
function destroyResultEnvelopeData(result: RingDestroyResult): {
  destroyed: boolean;
  remote_succeeded: boolean;
  local_wiped: boolean;
  member_ejected: boolean;
} {
  return {
    destroyed: result.trustchainDestroyed,
    remote_succeeded: result.remoteSucceeded,
    local_wiped: result.localWiped,
    member_ejected: result.remoteSucceeded && !!result.memberEjected,
  };
}

/** Json envelope fields for an enroll/init result — identical for `ring` and Ledger Sync. */
function memberInfoEnvelopeData(
  memberName: string,
  rootId: string,
): { member: string; root_id: string } {
  return { member: memberName, root_id: rootId };
}

/** Human rendering for an enroll/init result — identical for `ring` and Ledger Sync bar the closing
 * next-step hint. An options object, not positional strings, so a future third caller can't
 * transpose `memberName`/`rootId`/`nextStepHint` past the type checker (same reasoning as
 * `createLkrpSdk`'s options object in `key-ring/lkrp-sdk.ts`). */
function renderMemberInfo(args: {
  memberName: string;
  rootId: string;
  nextStepHint: string;
}): void {
  writeStdout("");
  writeStdout(`${colors.bold("Member:")}  ${args.memberName}`);
  writeStdout(`${colors.bold("Root ID:")} ${args.rootId}`);
  writeStdout(colors.dim(args.nextStepHint));
}

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
  token(t: TokenInfo): void;
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
  /**
   * Reconcile the labels printed/buffered during the scan with the authoritative ones assigned by
   * the locked merge in `account discover` — a concurrent write during the (potentially long) device
   * scan can shift what label a descriptor ends up with. `labels[i]` is the final label for the i-th
   * account streamed via `discoveredAccount`, in that same order. Human: prints a correction notice
   * for any label that changed. Json: patches the buffered accounts in place. Call before
   * `flushDiscovery`.
   */
  reconcileDiscoveredLabels(labels: readonly string[]): void;
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
    /** Display units. */
    amountExpectedTo?: string;
    /** Atomic units. */
    amountExpectedToAtomic?: string;
    /** Atomic-to over atomic-from. */
    magnitudeAwareRate?: string;
  }): void;

  swapExecuteDieResult(args: {
    plan: string;
    from: string;
    to: string;
    provider: string;
    amount: string;
    quoteId: string | null;
    approvalTxHash?: string;
    swapTxHash?: string;
  }): void;

  // ---- Earn ----

  /** Print earn yield opportunities (human: one line per row; json: envelope with `yields`). */
  earnYields(rows: EarnYieldRow[]): void;
  /**
   * Print earn positions (human: one block per position, then the account's on-chain Solana stake
   * accounts once; json: envelope with `positions` and, when present, an account-level `stakes`).
   */
  earnPositions(rows: EarnPositionRow[], stakes?: EarnSolanaStake[]): Promise<void>;
  /** Print the result of an earn deposit (human: summary lines; json: envelope). */
  earnDepositResult(result: EarnDepositResult): void;
  /** Print the result of an earn withdraw (human: summary lines; json: envelope). */
  earnWithdrawResult(result: EarnWithdrawResult): void;

  // ---- Ring ----

  /** Output ring init result (human: member + rootId lines; json: envelope). */
  ringInit(result: { memberName: string; rootId: string }): void;
  /** Output key names table (human: table or empty message; json: envelope with keys array). */
  ringKeys(domains: ReadonlyArray<{ domain: string; firstUsed: string }>): void;
  /** Output ring destroy result (human: colored message; json: envelope). */
  ringDestroy(result: RingDestroyResult): void;
  /** User cancelled destroy confirmation (human: stderr line; json: envelope with cancelled:true). */
  ringDestroyCancelled(): void;
  /** Output encrypt-to-file result (human: ✔ line; json: envelope with output path + bytes). */
  ringEncrypt(result: { dest: string; bytes: number }): void;
  /** Output decrypt-to-file result (human: ✔ line; json: envelope with output path). */
  ringDecrypt(result: { dest: string }): void;

  // ---- Agent Intent ----

  /** Output agent-intent profiles (human: table or empty message; json: envelope with `profiles`). */
  agentIntentProfiles(profiles: readonly AgentIntentProfileMeta[]): void;
  /** Output one agent-intent profile's detail (human: labeled lines; json: envelope). Never includes
   * the profile's secret key (not part of AgentIntentProfileMeta). */
  agentIntentProfileShow(profile: AgentIntentProfileMeta): void;
  /** Output the result of `agent-intent enroll` (human: URL + fingerprint to compare against the
   * device; json: envelope). Never includes the secret key. */
  agentIntentEnroll(result: {
    profileId: string;
    enrollmentUrl: string;
    fingerprint: string;
  }): void;
  /** Output the result of `agent-intent complete` (human: confirmation line; json: envelope). */
  agentIntentComplete(result: { profileId: string; trustchainId: string }): void;

  // ---- Ledger Sync (NTTVS-728) ----

  /** Output the result of `ledger-sync enroll` (human: member/root lines; json: envelope). */
  ledgerSyncEnroll(result: { memberName: string; rootId: string }): void;
  /** Output the result of `ledger-sync import` (human: grouped lines; json: envelope with the four
   * imported/unchanged/skipped/invalid arrays). */
  ledgerSyncImport(report: LedgerSyncImportReport): void;
  /** Output `ledger-sync destroy` result (human: colored message; json: envelope). */
  ledgerSyncDestroy(result: LedgerSyncDestroyResult): void;
  /** User cancelled the destroy confirmation (human: stderr line; json: envelope with cancelled:true). */
  ledgerSyncDestroyCancelled(): void;
}

// ---------------------------------------------------------------------------
// HumanCommandOutput
// ---------------------------------------------------------------------------

class HumanCommandOutput implements CommandOutput {
  private _activeSpin: Spinner | null = null;
  // Labels as printed live during the scan, in stream order — kept only to diff against the
  // authoritative labels `reconcileDiscoveredLabels` receives after the locked merge.
  private readonly _discoveredLabels: string[] = [];

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

  token(t: TokenInfo): void {
    writeStdout(this._fmt.formatTokenInfo(t));
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
    this._discoveredLabels.push(d.label);
    writeStdout(this._fmt.formatDiscoveredAccount(d));
  }

  reconcileDiscoveredLabels(labels: readonly string[]): void {
    const corrections = labels
      .map((label, i) => [this._discoveredLabels[i], label] as const)
      .filter(([printed, final]) => printed !== undefined && printed !== final);
    if (corrections.length === 0) return;
    writeStdout(
      colors.dim(
        corrections
          .map(([printed, final]) => `  label corrected: ${printed} -> ${final}`)
          .join("\n"),
      ),
    );
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
        writeStdout(`hash: ${event.txHash}`);
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
    amountExpectedToAtomic?: string;
    magnitudeAwareRate?: string;
  }): void {
    writeStdout(`${colors.bold("From:")} ${args.from}\n`);
    writeStdout(`${colors.bold("To:")} ${args.to}\n`);
    this.swapExecutePayloadResult(args);
    if (args.amountExpectedTo) {
      writeStdout(`${colors.bold("Amount expected to:")} ${args.amountExpectedTo}\n`);
    }
    if (args.operationHash) {
      writeStdout(`${colors.bold("Operation hash:")} ${args.operationHash}\n`);
    }
  }

  swapExecuteDieResult(args: {
    plan: string;
    from: string;
    to: string;
    provider: string;
    amount: string;
    quoteId: string | null;
    approvalTxHash?: string;
    swapTxHash?: string;
  }): void {
    writeStdout(`${colors.bold("Pipeline:")} (${args.plan})\n`);
    writeStdout(`${colors.bold("From:")} ${args.from}\n`);
    writeStdout(`${colors.bold("To:")} ${args.to}\n`);
    writeStdout(`${colors.bold("Provider:")} ${args.provider}\n`);
    writeStdout(`${colors.bold("Amount:")} ${args.amount}\n`);
    writeStdout(`${colors.bold("Quote ID:")} ${args.quoteId ?? "(none)"}\n`);
    if (args.approvalTxHash) {
      writeStdout(`${colors.bold("Approval tx hash:")} ${args.approvalTxHash}\n`);
    }
    if (args.swapTxHash) {
      writeStdout(`${colors.bold("Swap tx hash:")} ${args.swapTxHash}\n`);
    }
  }

  earnYields(rows: EarnYieldRow[]): void {
    renderEarnYields(rows);
  }

  async earnPositions(rows: EarnPositionRow[], stakes?: EarnSolanaStake[]): Promise<void> {
    await renderEarnPositions(this._fmt, rows, stakes);
  }

  earnDepositResult(result: EarnDepositResult): void {
    renderEarnDepositResult(result);
  }

  earnWithdrawResult(result: EarnWithdrawResult): void {
    renderEarnWithdrawResult(result);
  }

  ringInit({ memberName, rootId }: { memberName: string; rootId: string }): void {
    renderMemberInfo({
      memberName,
      rootId,
      nextStepHint: "Encrypt/decrypt with: wallet-cli ring encrypt --key <name>",
    });
  }

  ringKeys(domains: ReadonlyArray<{ domain: string; firstUsed: string }>): void {
    if (domains.length === 0) {
      writeStdout(colors.dim("No keys yet. Use `ring encrypt --key <name>` to create one."));
      return;
    }
    const w = Math.max(3, ...domains.map(d => d.domain.length));
    writeStdout(`${colors.bold("Key".padEnd(w))}  ${colors.bold("First Used")}`);
    writeStdout("─".repeat(w + 2 + 10));
    for (const { domain, firstUsed } of domains) {
      writeStdout(`${domain.padEnd(w)}  ${firstUsed.slice(0, 10)}`);
    }
  }

  ringDestroy(result: RingDestroyResult): void {
    // Report the remote outcome first so a successful teardown is never hidden by a local-wipe
    // failure, then append the local-credentials warning when the keychain delete did not succeed.
    switch (destroyOutcome(result)) {
      case "destroyed":
        writeStdout(`${colors.green("✔")} Ledger Key Ring destroyed.`);
        break;
      case "ejected":
        writeStdout(
          `${colors.green("✔")} wallet-cli is no longer a member of this Ledger Key Ring — it was removed, or the ring was destroyed remotely.`,
        );
        break;
      case "deactivated":
        writeStdout(
          `${colors.green("✔")} wallet-cli application deactivated (Ledger Key Ring kept for other apps).`,
        );
        break;
      case "local-wiped-only":
        writeStdout(
          `${colors.green("✔")} Ledger Key Ring local credentials wiped (remote teardown skipped or failed).`,
        );
        break;
      case "nothing-done":
        // Remote teardown never ran (creds unusable, or a stray key with no live ring) and the local
        // wipe also failed — nothing was removed. Without this line the command would emit only the
        // keychain warning below, leaving the overall outcome ambiguous.
        writeStdout(
          `${colors.red("✖")} Ledger Key Ring not destroyed — remote teardown did not run.`,
        );
        break;
    }
    if (!result.localWiped) {
      writeStdout(
        `${colors.yellow("⚠")} Could not remove local credentials from the OS keychain — delete the "member-private-key-…" account under the "${APP_NAME}" service manually.`,
      );
    }
  }

  ringDestroyCancelled(): void {
    writeStderr("Cancelled.\n");
  }

  ringEncrypt({ dest, bytes }: { dest: string; bytes: number }): void {
    writeStdout(`${colors.green("✔")} Written to ${dest} (${bytes} bytes, AES-256-GCM)`);
  }

  ringDecrypt({ dest }: { dest: string }): void {
    writeStdout(`${colors.green("✔")} Written to ${dest}`);
  }

  agentIntentProfiles(profiles: readonly AgentIntentProfileMeta[]): void {
    if (profiles.length === 0) {
      writeStdout(colors.dim("No Agent Intent profiles. Run `agent-intent enroll` first."));
      return;
    }
    const w = Math.max(7, ...profiles.map(p => p.profileId.length));
    writeStdout(
      `${colors.bold("PROFILE".padEnd(w))}  ${colors.bold("NAME")}  ${colors.bold("SOURCE")}  ` +
        `${colors.bold("ENVIRONMENT")}  ${colors.bold("STATUS")}`,
    );
    for (const p of profiles) {
      writeStdout(
        `${p.profileId.padEnd(w)}  ${p.displayName}  ${p.source}  ${p.environment}  ` +
          agentIntentProfileStatus(p),
      );
    }
  }

  agentIntentProfileShow(profile: AgentIntentProfileMeta): void {
    const labels = [
      "Profile",
      "Name",
      "Description",
      "Source",
      "Environment",
      "Status",
      "Public key",
      "Fingerprint",
      "BFF URL",
      "Trustchain ID",
      "Created",
    ];
    const labelWidth = Math.max(...labels.map(l => l.length)) + 1; // +1 for the trailing ":"
    const line = (label: string, value: string): string =>
      `${(label + ":").padEnd(labelWidth)} ${value}`;
    writeStdout(
      [
        line("Profile", profile.profileId),
        line("Name", profile.displayName),
        line("Description", profile.description),
        line("Source", profile.source),
        line("Environment", profile.environment),
        line("Status", agentIntentProfileStatus(profile)),
        line("Public key", profile.publicKey),
        line("Fingerprint", formatAgentPublicKeyFingerprint(profile.publicKey)),
        line("BFF URL", redactUrlCredentials(profile.bffBaseUrl)),
        ...(profile.trustchainId === undefined
          ? []
          : [line("Trustchain ID", profile.trustchainId)]),
        line("Created", profile.createdAt),
      ].join("\n"),
    );
  }

  agentIntentEnroll({
    profileId,
    enrollmentUrl,
    fingerprint,
  }: {
    profileId: string;
    enrollmentUrl: string;
    fingerprint: string;
  }): void {
    writeStdout(enrollmentUrl);
    writeStdout("");
    writeStdout(`Public key fingerprint: ${fingerprint}`);
    writeStdout(
      colors.dim(
        "Compare this fingerprint with the one shown when the enrollment link is opened, before " +
          "approving — this step never touches a Ledger device.",
      ),
    );
    writeStdout(
      colors.dim(
        `Profile "${profileId}" saved. After approval, run \`agent-intent complete --profile ${profileId}\`.`,
      ),
    );
  }

  agentIntentComplete({
    profileId,
    trustchainId,
  }: {
    profileId: string;
    trustchainId: string;
  }): void {
    writeStdout(
      `${colors.green("✔")} Agent Intent profile "${profileId}" enrolled. Trustchain ID: ${trustchainId}`,
    );
  }

  ledgerSyncEnroll({ memberName, rootId }: { memberName: string; rootId: string }): void {
    renderMemberInfo({
      memberName,
      rootId,
      nextStepHint: "Import accounts with: wallet-cli ledger-sync import",
    });
  }

  ledgerSyncImport(report: LedgerSyncImportReport): void {
    const { imported, unchanged, skipped, invalid } = report;
    if (imported.length + unchanged.length + skipped.length + invalid.length === 0) {
      writeStdout(colors.dim("Up to date. Nothing to import."));
      return;
    }
    if (imported.length > 0) {
      writeStdout(colors.bold(`Imported (${imported.length}):`));
      for (const e of imported) writeStdout(`  ${e.label}  ${colors.dim(e.network)}`);
    }
    if (unchanged.length > 0) {
      writeStdout(
        colors.dim(`Unchanged (${unchanged.length}): ${unchanged.map(e => e.label).join(", ")}`),
      );
    }
    if (skipped.length > 0) {
      writeStdout(colors.bold(`Skipped (${skipped.length}, unsupported):`));
      for (const e of skipped) writeStdout(`  ${e.id}: ${e.reason}`);
    }
    if (invalid.length > 0) {
      writeStdout(colors.bold(`Invalid (${invalid.length}):`));
      for (const e of invalid) writeStdout(`  ${e.id}: ${e.reason}`);
    }
  }

  ledgerSyncDestroy(result: LedgerSyncDestroyResult): void {
    const outcome = destroyOutcome(result);
    switch (outcome) {
      case "destroyed":
        writeStdout(`${colors.green("✔")} Ledger Sync destroyed.`);
        break;
      case "ejected":
        writeStdout(
          `${colors.green("✔")} wallet-cli is no longer a Ledger Sync member — it was removed, or Ledger Sync was deactivated remotely.`,
        );
        break;
      case "deactivated":
        writeStdout(`${colors.green("✔")} Ledger Sync deactivated for this machine.`);
        break;
      case "local-wiped-only":
        writeStdout(
          `${colors.green("✔")} Ledger Sync local credentials wiped (remote teardown skipped or failed).`,
        );
        break;
      case "nothing-done":
        // Already communicates the local-wipe failure — the trailing warning below would be redundant.
        writeStdout(`${colors.yellow("⚠")} Local credentials could not be removed.`);
        break;
    }
    // A remote success (destroyed/ejected/deactivated) can still leave localWiped false — without
    // this, that combination silently reports a clean "✔" while a keychain entry lingers.
    if (!result.localWiped && outcome !== "nothing-done") {
      writeStdout(
        `${colors.yellow("⚠")} Could not remove local Ledger Sync credentials from the OS keychain — ` +
          `delete the "ledger-sync-member-key-…" account under the "${APP_NAME}" service manually.`,
      );
    }
  }

  ledgerSyncDestroyCancelled(): void {
    writeStderr("Cancelled.\n");
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

  token(t: TokenInfo): void {
    this._writeNdjson(this._envelope({ token: this._jsonFmt.token(t) }));
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

  reconcileDiscoveredLabels(labels: readonly string[]): void {
    labels.forEach((label, i) => {
      const account = this._discoveredAccounts[i];
      if (account) account.label = label;
    });
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
    amountExpectedToAtomic?: string;
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
        amountExpectedToAtomic: args.amountExpectedToAtomic,
        magnitudeAwareRate: args.magnitudeAwareRate,
      }),
    );
  }

  swapExecuteDieResult(args: {
    plan: string;
    from: string;
    to: string;
    provider: string;
    amount: string;
    quoteId: string | null;
    approvalTxHash?: string;
    swapTxHash?: string;
  }): void {
    this._writeNdjson(
      this._envelope({
        plan: args.plan,
        from: args.from,
        to: args.to,
        provider: args.provider,
        amount: args.amount,
        quoteId: args.quoteId,
        approvalTxHash: args.approvalTxHash,
        swapTxHash: args.swapTxHash,
      }),
    );
  }

  earnYields(rows: EarnYieldRow[]): void {
    this._writeNdjson(this._envelope({ yields: rows }));
  }

  async earnPositions(rows: EarnPositionRow[], stakes?: EarnSolanaStake[]): Promise<void> {
    this._writeNdjson(
      this._envelope({ positions: rows, ...(stakes === undefined ? {} : { stakes }) }),
    );
  }

  earnDepositResult(result: EarnDepositResult): void {
    this._writeNdjson(this._envelope({ ...result }));
  }

  earnWithdrawResult(result: EarnWithdrawResult): void {
    this._writeNdjson(this._envelope({ ...result }));
  }

  ringInit({ memberName, rootId }: { memberName: string; rootId: string }): void {
    this._writeNdjson(this._envelope(memberInfoEnvelopeData(memberName, rootId)));
  }

  ringKeys(domains: ReadonlyArray<{ domain: string; firstUsed: string }>): void {
    this._writeNdjson(
      this._envelope({ keys: domains.map(d => ({ domain: d.domain, first_used: d.firstUsed })) }),
    );
  }

  ringDestroy(result: RingDestroyResult): void {
    this._writeNdjson(this._envelope(destroyResultEnvelopeData(result)));
  }

  ringDestroyCancelled(): void {
    this._writeNdjson(this._envelope({ cancelled: true }));
  }

  ringEncrypt({ dest, bytes }: { dest: string; bytes: number }): void {
    this._writeNdjson(this._envelope({ output: dest, bytes }));
  }

  ringDecrypt({ dest }: { dest: string }): void {
    this._writeNdjson(this._envelope({ output: dest }));
  }

  agentIntentProfiles(profiles: readonly AgentIntentProfileMeta[]): void {
    this._writeNdjson(
      this._envelope({
        profiles: profiles.map(p => ({
          ...p,
          bffBaseUrl: redactUrlCredentials(p.bffBaseUrl),
          // `profileStatus`, not `status` — the envelope already uses `status` for success/error.
          profileStatus: agentIntentProfileStatus(p),
        })),
      }),
    );
  }

  agentIntentProfileShow(profile: AgentIntentProfileMeta): void {
    // Nested under `profile`, matching `agentIntentProfiles`'s `profiles` — spreading the profile's
    // own fields into the envelope (as this used to) would silently collide with envelope fields of
    // the same name (`makeEnvelope` applies `...data` after `status`/`account`/etc., so a future
    // profile field named e.g. `account` would overwrite it without warning).
    this._writeNdjson(
      this._envelope({
        profile: {
          ...profile,
          bffBaseUrl: redactUrlCredentials(profile.bffBaseUrl),
          profileStatus: agentIntentProfileStatus(profile),
          fingerprint: formatAgentPublicKeyFingerprint(profile.publicKey),
        },
      }),
    );
  }

  agentIntentEnroll(result: {
    profileId: string;
    enrollmentUrl: string;
    fingerprint: string;
  }): void {
    this._writeNdjson(
      this._envelope({
        profileId: result.profileId,
        enrollmentUrl: result.enrollmentUrl,
        fingerprint: result.fingerprint,
      }),
    );
  }

  agentIntentComplete(result: { profileId: string; trustchainId: string }): void {
    this._writeNdjson(
      this._envelope({
        profileId: result.profileId,
        trustchainId: result.trustchainId,
        completed: true,
      }),
    );
  }

  ledgerSyncEnroll({ memberName, rootId }: { memberName: string; rootId: string }): void {
    this._writeNdjson(this._envelope(memberInfoEnvelopeData(memberName, rootId)));
  }

  ledgerSyncImport(report: LedgerSyncImportReport): void {
    this._writeNdjson(this._envelope({ ...report }));
  }

  ledgerSyncDestroy(result: LedgerSyncDestroyResult): void {
    this._writeNdjson(this._envelope(destroyResultEnvelopeData(result)));
  }

  ledgerSyncDestroyCancelled(): void {
    this._writeNdjson(this._envelope({ cancelled: true }));
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
