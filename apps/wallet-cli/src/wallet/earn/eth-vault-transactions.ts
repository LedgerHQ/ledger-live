import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { walletCliDebug } from "../../shared/log";
import { EvmTransactionIntentSchema } from "../intents";
import { prepareIntentDryRun, signAndBroadcastIntent } from "../sign-and-broadcast";

import type { CommandOutput } from "../../output";
import type { WalletAdapter } from "../index";
import type { TransactionIntent } from "../intents";
import type { AccountDescriptor } from "../models";
import { EarnApiError, getEthTxStatus } from "./api";
import type { EthTxStatus } from "./api.types";
import type { EarnDeviceContext } from "./device-context";
import {
  EVM_VAULT_GAS_LIMIT_MULTIPLIER,
  EVM_VAULT_KILN_DEPENDENCIES,
  EVM_VAULT_TX_STATUS_POLL_ATTEMPTS,
  EVM_VAULT_TX_STATUS_POLL_INTERVAL_MS,
} from "./eth-vault-policy";
import type { NormalizedDefiTransaction } from "./normalize";
import type { EarnTransaction } from "./types";

const TERMINAL_TX_STATUSES = new Set<EthTxStatus>(["success", "error"]);

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function zeroNativeAmount(currencyId: string): string {
  return `0 ${getCryptoCurrencyById(currencyId).ticker}`;
}

function buildEvmIntent(
  descriptor: AccountDescriptor,
  tx: NormalizedDefiTransaction,
): TransactionIntent {
  return EvmTransactionIntentSchema.parse({
    family: "evm",
    recipient: tx.to,
    amount: zeroNativeAmount(descriptor.currencyId),
    data: tx.data,
    gasLimitMultiplier: EVM_VAULT_GAS_LIMIT_MULTIPLIER,
  });
}

export async function runEvmVaultIntent(params: {
  wallet: WalletAdapter;
  descriptor: AccountDescriptor;
  tx: NormalizedDefiTransaction;
  kind: string;
  dryRun: boolean;
  device?: EarnDeviceContext;
  out: CommandOutput;
}): Promise<EarnTransaction> {
  const { wallet, descriptor, tx, kind, dryRun, device, out } = params;
  const intent = buildEvmIntent(descriptor, tx);

  if (dryRun) {
    await prepareIntentDryRun({ wallet, descriptor, intent, out });
    return { kind, to: tx.to, status: "dry-run" };
  }

  if (!device) {
    throw new Error("Device context is required to sign an EVM earn transaction.");
  }

  const { txHash } = await signAndBroadcastIntent({
    wallet,
    descriptor,
    intent,
    out,
    ...device,
    dependencies: EVM_VAULT_KILN_DEPENDENCIES,
  });
  if (!txHash) {
    throw new Error(`EVM ${kind} transaction was signed but no broadcast hash was returned.`);
  }
  return { kind, hash: txHash, to: tx.to, status: "broadcasted" };
}

// Exported (and `intervalMs`/`attempts` injectable) so tests can drive the retry/terminal logic
// without real sleeps. The defaults match the module constants, so production behavior is unchanged.
export async function pollEthTransactionStatus(
  txHash: string,
  opts: { out?: CommandOutput; label?: string; intervalMs?: number; attempts?: number } = {},
): Promise<EthTxStatus> {
  const {
    out,
    label = "transaction",
    intervalMs = EVM_VAULT_TX_STATUS_POLL_INTERVAL_MS,
    attempts = EVM_VAULT_TX_STATUS_POLL_ATTEMPTS,
  } = opts;
  let lastStatus: EthTxStatus = "unknown";
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    out?.spin(`Waiting for ${label} to confirm on-chain… (${attempt + 1}/${attempts})`);
    try {
      const response = await getEthTxStatus(txHash);
      lastStatus = response.data.status;
      if (TERMINAL_TX_STATUSES.has(lastStatus)) return lastStatus;
    } catch (error) {
      // A 4xx or contract-violating response (EarnApiError) will never resolve on its own — fail loud
      // instead of masquerading as pending and spinning the full poll. getEthTxStatus already maps the
      // "receipt not found yet" 5xx to pending_confirmation, so anything else reaching here is a
      // transient transport blip (e.g. network down), which is not fatal: keep waiting.
      if (error instanceof EarnApiError) throw error;
      walletCliDebug(`earn-api: polling ${txHash} failed (${String(error)}); retrying`);
      lastStatus = "pending_confirmation";
    }
    if (attempt < attempts - 1) await sleep(intervalMs);
  }
  return lastStatus;
}

export async function waitForApproveCompletion(
  approveHash: string,
  out?: CommandOutput,
): Promise<string> {
  const status = await pollEthTransactionStatus(approveHash, { out, label: "approve" });
  if (status !== "success") {
    throw new Error(
      `Approve transaction ${approveHash} did not reach success after ${
        (EVM_VAULT_TX_STATUS_POLL_ATTEMPTS * EVM_VAULT_TX_STATUS_POLL_INTERVAL_MS) / 1000
      }s (last status: ${status}). The approve may still be pending — re-run the deposit once it is mined to continue with the deposit leg.`,
    );
  }
  return status;
}

/**
 * Interpret the terminal status of a broadcast deposit/redeem so success and failure are reported
 * honestly (the JSON envelope is otherwise always stamped "success"):
 *   - "success" -> return "success".
 *   - "error"   -> the transaction reverted on-chain; throw so the command exits non-zero (and the
 *                  json output is an ok:false envelope) instead of masquerading as a success.
 *   - otherwise -> the poll timed out before the tx was mined (pending_confirmation/unknown); return
 *                  "pending" — a clear non-success status. The hash is preserved by the caller so the
 *                  user can re-check later.
 */
export function resolveTerminalTxStatus(
  status: EthTxStatus,
  opts: { hash: string; label: string },
): string {
  if (status === "success") return "success";
  if (status === "error") {
    throw new Error(
      `${opts.label} transaction ${opts.hash} reverted on-chain (status: error). Check the transaction on a block explorer; no funds moved into/out of the vault.`,
    );
  }
  return "pending";
}
