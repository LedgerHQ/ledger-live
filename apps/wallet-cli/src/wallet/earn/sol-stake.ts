/**
 * Solana (native staking) earn deposit/withdraw pipeline.
 *
 * The `earn deposit` / `earn withdraw` commands dispatch here for the `solana` family. We reuse
 * the native Solana staking transaction modes through the bridge (see buildSolanaTransactionModel
 * in ../compatibility/bridge.ts), exactly the way `send.ts` runs a Solana intent:
 *   deposit:  Solana intent `mode: stake.createAccount` (+delegate) with `--product` = validator.
 *             coin-solana's stake.createAccount creates AND delegates a stake account in one tx.
 *   withdraw: two-phase on Solana —
 *             1. `mode: stake.undelegate` (deactivate) by default; the lamports stay locked until
 *                the deactivation epoch boundary passes (typically the next epoch, ~2-3 days).
 *             2. `mode: stake.withdraw` once `--finalize` is passed, moving the now-inactive
 *                lamports back to the main account.
 *
 * Device + dry-run handling is delegated to the shared `../sign-and-broadcast` helper, exactly as
 * `send.ts` does: `prepareIntentDryRun` only prepares/validates the intent (no device, emits no
 * terminal envelope) and returns the prepared tx, and `signAndBroadcastIntent` owns the device
 * session (`withCurrencyDeviceSession`) and device-model resolution before calling `wallet.send`.
 * Emitting the result envelope stays with the earn command layer. Native Solana-app clear signing —
 * no plugin/CAL dependency.
 *
 * Do NOT change the exported signatures without coordinating with the earn commands — they are the
 * integration contract.
 */

import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { WalletAdapter } from "../index";
import type { AccountDescriptor } from "../models";
import { SolanaTransactionIntentSchema } from "../intents";
import type { TransactionIntent } from "../intents";
import { prepareIntentDryRun, signAndBroadcastIntent } from "../sign-and-broadcast";
import type { CommandOutput } from "../../output";
import type { EarnDeviceContext } from "./device-context";
import type { EarnDepositResult, EarnTransaction, EarnWithdrawResult } from "./types";

/** Parameters for a Solana native staking deposit (create + delegate). */
export type DepositSolanaParams = {
  /** Resolved source account (the Solana account funding the stake). */
  descriptor: AccountDescriptor;
  /** Canonical network string, e.g. "solana:main". */
  network: string;
  /** Validator vote account address to delegate to (the `--product` value for SOL). */
  validator: string;
  /** Human stake amount, e.g. "1.5 SOL". */
  amount: string;
  /** When true, prepare/validate only — never sign or broadcast. */
  dryRun: boolean;
  /** Wallet adapter used to build/sign/broadcast Solana intents. */
  wallet: WalletAdapter;
  /** Output sink for progress + final result. */
  out: CommandOutput;
  /** Device context. Omitted only when `dryRun` is true. */
  device?: EarnDeviceContext;
};

/** Parameters for a Solana native staking withdrawal (undelegate / finalize withdraw). */
export type WithdrawSolanaParams = {
  /** Resolved source account (the Solana account that owns the stake account). */
  descriptor: AccountDescriptor;
  /** Canonical network string, e.g. "solana:main". */
  network: string;
  /** Stake account address to undelegate / withdraw from. */
  stakeAccount: string;
  /**
   * Rejected when set: partial Solana withdrawals are unsupported (both phases act on the whole
   * stake account). Surfaced so the pipeline can throw a clear error instead of silently ignoring.
   */
  amount?: string;
  /**
   * Two-phase control:
   *   false (default) -> `stake.undelegate` (deactivate).
   *   true            -> `stake.withdraw` (move lamports back, after deactivation epoch).
   */
  finalize: boolean;
  /** When true, prepare/validate only — never sign or broadcast. */
  dryRun: boolean;
  /** Wallet adapter used to build/sign/broadcast Solana intents. */
  wallet: WalletAdapter;
  /** Output sink for progress + final result. */
  out: CommandOutput;
  /** Device context. Omitted only when `dryRun` is true. */
  device?: EarnDeviceContext;
};

/** coin-solana ignores `tx.recipient` for every stake.* mode (it routes on model.kind). */
const STAKE_RECIPIENT = "";

/**
 * Run one Solana stake intent through the wallet adapter, honouring dry-run.
 *
 * dry-run  -> `wallet.prepareSend` (sync + build + validate, no device); returns a "dry-run" step.
 * live     -> open the Solana device session and `wallet.send`; returns a "broadcasted" step with
 *             the broadcast hash, streaming progress to `out` exactly like `send.ts`.
 */
async function runSolanaStakeIntent(params: {
  wallet: WalletAdapter;
  descriptor: AccountDescriptor;
  intent: TransactionIntent;
  kind: string;
  dryRun: boolean;
  device?: EarnDeviceContext;
  out: CommandOutput;
}): Promise<EarnTransaction> {
  const { wallet, descriptor, intent, kind, dryRun, device, out } = params;

  if (dryRun) {
    await prepareIntentDryRun({ wallet, descriptor, intent, out });
    return { kind, status: "dry-run" };
  }

  if (!device) {
    throw new Error("Device context is required to sign a Solana stake transaction.");
  }

  const { txHash } = await signAndBroadcastIntent({ wallet, descriptor, intent, out, ...device });
  // signAndBroadcastIntent only sets txHash when a `broadcasted` event is observed; it can resolve
  // without one. Mirror the EVM guard (see runEvmVaultIntent) and fail loud instead of returning a
  // "broadcasted" envelope with no hash, which would falsely report an unstake/withdraw as done.
  if (!txHash) {
    throw new Error(`Solana ${kind} transaction was signed but no broadcast hash was returned.`);
  }
  return { kind, hash: txHash, status: "broadcasted" };
}

/** Build a "0 <TICKER>" amount string for stake modes that ignore the tx amount. */
function zeroAmount(currencyId: string): string {
  return `0 ${getCryptoCurrencyById(currencyId).ticker}`;
}

/**
 * Stake (create + delegate) via native Solana staking.
 *
 * Builds a `stake.createAccount` intent for the requested validator. coin-solana's
 * stake.createAccount creates the stake account and delegates it to the validator in a single
 * transaction, so no separate delegate step is required.
 */
export async function depositSolana(params: DepositSolanaParams): Promise<EarnDepositResult> {
  const { descriptor, network, validator, amount, dryRun, wallet, out, device } = params;

  if (!validator) {
    throw new Error(
      "Solana deposit requires a validator vote account address via --product <validator>.",
    );
  }

  const intent = SolanaTransactionIntentSchema.parse({
    family: "solana",
    recipient: STAKE_RECIPIENT,
    amount,
    mode: "stake.createAccount",
    validator,
  });

  const tx = await runSolanaStakeIntent({
    wallet,
    descriptor,
    intent,
    kind: "stake.createAccount",
    dryRun,
    device,
    out,
  });

  return {
    family: "solana",
    account: descriptor.id,
    network,
    amount,
    product: validator,
    validator,
    dryRun,
    status: dryRun ? "dry-run" : "broadcasted",
    transactions: [tx],
  };
}

/**
 * Unstake via native Solana staking — two-phase.
 *
 * Default (no --finalize): `stake.undelegate` deactivates the stake account. The lamports remain
 * locked until the deactivation epoch boundary passes (typically the next epoch).
 *
 * With --finalize: `stake.withdraw` moves the now-inactive lamports back to the main account.
 * coin-solana derives the withdrawable amount on-chain, so the full inactive balance is withdrawn
 * regardless of `--amount`.
 *
 * Partial withdrawals are unsupported: both phases operate on the entire stake account, so a
 * provided `amount` is rejected up-front (rather than silently ignored) to avoid misleading users
 * into thinking they are unstaking only part of their balance.
 */
export async function withdrawSolana(params: WithdrawSolanaParams): Promise<EarnWithdrawResult> {
  const { descriptor, network, stakeAccount, amount, finalize, dryRun, wallet, out, device } =
    params;

  if (!stakeAccount) {
    throw new Error("Solana withdraw requires the stake account address via --stake-account.");
  }

  if (amount !== undefined) {
    throw new Error(
      "Partial Solana withdraw is unsupported: omit --amount. Unstaking always affects the " +
        "entire stake account (deactivate, then --finalize to withdraw the full balance).",
    );
  }

  const mode = finalize ? "stake.withdraw" : "stake.undelegate";

  const intent = SolanaTransactionIntentSchema.parse({
    family: "solana",
    recipient: STAKE_RECIPIENT,
    // undelegate/withdraw ignore the tx amount (coin-solana computes it on-chain): undelegate
    // deactivates the whole account and withdraw uses the on-chain withdrawable balance. Pass a
    // valid placeholder so the intent schema accepts it.
    amount: zeroAmount(descriptor.currencyId),
    mode,
    stakeAccount,
  });

  const tx = await runSolanaStakeIntent({
    wallet,
    descriptor,
    intent,
    kind: mode,
    dryRun,
    device,
    out,
  });

  return {
    family: "solana",
    account: descriptor.id,
    network,
    stakeAccount,
    finalize,
    dryRun,
    status: dryRun ? "dry-run" : "broadcasted",
    transactions: [tx],
  };
}
