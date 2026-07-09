/**
 * ETH (EVM) earn deposit/withdraw orchestration.
 *
 * The `earn deposit` / `earn withdraw` commands dispatch here for the `evm` family. Vaults are
 * resolved from GET /v1/defi/products, which acts as the trusted allowlist. Backend-built calldata
 * is passed through the regular EVM bridge intent and then into bridge.signOperation.
 *
 * Clear signing relies on the Ethereum app PLUS the "Kiln" app, which decodes the ERC-20 approve and
 * ERC-4626 deposit/redeem calldata the generic Ethereum app cannot. The transaction module opens the
 * currency's Ethereum app with the Kiln dependency so ConnectApp ensures the Kiln app is installed
 * (mirroring how the wallet-api passes `hwAppId`/dependencies). Manual QA on device is required to
 * verify the displayed screens.
 *
 * Security posture: the /v1/defi/* requests are sent with `ignore_checks: true`, which deliberately
 * bypasses the backend's pre-flight safety simulation. The CLI does not decode/inspect the returned
 * calldata body either — it only asserts the transaction `to` is the allowlisted asset/vault address
 * (assertTransactionTarget) and that it carries zero native value (assertZeroNativeValue). The
 * authoritative protection is the on-device Kiln clear-signing: the user reviews the decoded
 * approve/deposit/redeem on the Ledger screen before approving, so the device — not the backend — is
 * the source of truth for what gets signed.
 *
 * Do NOT change the exported signatures without coordinating with the earn commands — they are the
 * integration contract.
 */

import { getDefiProducts, postDefiApprove, postDefiDeposit, postDefiWithdraw } from "./api";
import type { CommandOutput } from "../../output";
import type { WalletAdapter } from "../index";
import type { AccountDescriptor } from "../models";
import { assertAmountTickerMatchesAsset, parseAmountToBaseUnits } from "./eth-vault-amounts";
import {
  accountAddress,
  requireAsset,
  requireAssetDecimals,
  requireChainId,
  requireVault,
  resolveDefiProduct,
} from "./eth-vault-products";
import { buildDepositRequest, buildWithdrawRequest } from "./eth-vault-requests";
import {
  assertAccountMatchesProductChain,
  assertEvmVaultTransactionSafety,
  assertVaultDepositable,
} from "./eth-vault-policy";
import {
  pollEthTransactionStatus,
  resolveTerminalTxStatus,
  runEvmVaultIntent,
  waitForApproveCompletion,
} from "./eth-vault-transactions";
import type { EarnDeviceContext } from "./device-context";
import { normalizeDefiProduct, normalizeDefiTransaction } from "./normalize";
import type { DefiDepositRequest } from "./api.types";
import type { NormalizedDefiProduct } from "./normalize";
import type { EarnDepositResult, EarnTransaction, EarnWithdrawResult } from "./types";

// This module is the stable integration surface for the EVM earn flow: the `earn` commands and tests
// import deposit/withdraw plus these helpers from here, so the internal file split (amounts / products
// / requests / policy / transactions / normalize) can change without touching call sites. Keep the
// re-exports below in sync with what those callers depend on.
export { assertAmountTickerMatchesAsset, parseAmountToBaseUnits } from "./eth-vault-amounts";
export { resolveDefiProduct } from "./eth-vault-products";
export {
  assertAccountMatchesProductChain,
  assertTransactionChainId,
  assertTransactionTarget,
  assertZeroNativeValue,
} from "./eth-vault-policy";
export { pollEthTransactionStatus, resolveTerminalTxStatus } from "./eth-vault-transactions";
export type { EarnDeviceContext } from "./device-context";

/** Parameters for an EVM vault deposit. */
export type DepositEvmParams = {
  /** Resolved source account (the EVM account funding the deposit). */
  descriptor: AccountDescriptor;
  /** Canonical network string, e.g. "ethereum:main". */
  network: string;
  /** Vault id from GET /v1/defi/products (the trusted-vault allowlist key). */
  productId: string;
  /** Human deposit amount including/excluding ticker as accepted by the command. */
  amount: string;
  /** When true, prepare/validate only — never sign or broadcast. */
  dryRun: boolean;
  /** Wallet adapter used to build/sign/broadcast EVM intents. */
  wallet: WalletAdapter;
  /** Output sink for progress + final result. */
  out: CommandOutput;
  /** Device context. Omitted only when `dryRun` is true. */
  device?: EarnDeviceContext;
};

/** Parameters for an EVM vault withdrawal (redeem). */
export type WithdrawEvmParams = {
  /** Resolved source account (the EVM account that owns the vault shares). */
  descriptor: AccountDescriptor;
  /** Canonical network string, e.g. "ethereum:main". */
  network: string;
  /** Vault id from GET /v1/defi/products. */
  productId: string;
  /** Human amount to withdraw; when omitted the full share balance is redeemed. */
  amount?: string;
  /** When true, prepare/validate only — never sign or broadcast. */
  dryRun: boolean;
  /** Wallet adapter used to build/sign/broadcast EVM intents. */
  wallet: WalletAdapter;
  /** Output sink for progress + final result. */
  out: CommandOutput;
  /** Device context. Omitted only when `dryRun` is true. */
  device?: EarnDeviceContext;
};

/**
 * Shared inputs for the approve/deposit steps of an EVM vault deposit: the built backend request plus
 * everything needed to validate, sign and broadcast one step's calldata.
 */
type EvmDepositContext = {
  descriptor: AccountDescriptor;
  request: DefiDepositRequest;
  expectedChainId: number;
  dryRun: boolean;
  wallet: WalletAdapter;
  out: CommandOutput;
  device?: EarnDeviceContext;
};

type ApproveResult = {
  /** True when the on-chain ERC-20 allowance is insufficient and an approve tx had to be built. */
  approveRequired: boolean;
  /** The approve EarnTransaction, present only when `approveRequired`. */
  approveTx?: EarnTransaction;
};

/**
 * Run the ERC-20 approve step. A `transaction` response (rather than a 204 `no-action`) means the
 * current allowance is insufficient and must be raised before the vault can pull the funds; that
 * calldata is validated against the asset address, then signed/broadcast (and awaited to success so
 * the deposit is only attempted once the allowance is actually mined).
 */
async function runApprove(ctx: EvmDepositContext, asset: string): Promise<ApproveResult> {
  const { descriptor, request, expectedChainId, dryRun, wallet, out, device } = ctx;
  const approve = await postDefiApprove(request);
  if (approve.kind !== "transaction") return { approveRequired: false };

  const approveData = normalizeDefiTransaction(approve.data);
  assertEvmVaultTransactionSafety(
    approveData,
    accountAddress(descriptor),
    asset,
    expectedChainId,
    "approve",
  );
  const approveTx = await runEvmVaultIntent({
    wallet,
    descriptor,
    tx: approveData,
    kind: "approve",
    dryRun,
    device,
    out,
  });
  if (!dryRun && approveTx.hash) {
    approveTx.status = await waitForApproveCompletion(approveTx.hash, out);
  }
  return { approveRequired: true, approveTx };
}

/**
 * Run the vault deposit: validate the backend calldata against the vault address, sign/broadcast it,
 * then (unless dry-run) poll to a terminal status so success/revert is reported honestly.
 */
async function runDeposit(ctx: EvmDepositContext, vault: string): Promise<EarnTransaction> {
  const { descriptor, request, expectedChainId, dryRun, wallet, out, device } = ctx;
  const deposit = await postDefiDeposit(request);
  const depositData = normalizeDefiTransaction(deposit.data);
  assertEvmVaultTransactionSafety(
    depositData,
    accountAddress(descriptor),
    vault,
    expectedChainId,
    "deposit",
  );
  const depositTx = await runEvmVaultIntent({
    wallet,
    descriptor,
    tx: depositData,
    kind: "deposit",
    dryRun,
    device,
    out,
  });
  if (!dryRun && depositTx.hash) {
    const depositStatus = await pollEthTransactionStatus(depositTx.hash, { out, label: "deposit" });
    depositTx.status = resolveTerminalTxStatus(depositStatus, {
      hash: depositTx.hash,
      label: "Deposit",
    });
  }
  return depositTx;
}

/**
 * Result for the dry-run case where an approve is still required. The deposit leg can only be built
 * once a non-zero allowance exists on-chain: /v1/defi/deposit simulates the vault call and reverts
 * (HTTP 500) while allowance is 0. In --dry-run nothing is broadcast, so the deposit cannot be
 * validated — surface that honestly instead of letting the build fail with an opaque 500.
 */
function pendingApproveDryRunResult(params: {
  descriptor: AccountDescriptor;
  network: string;
  amount: string;
  product: NormalizedDefiProduct;
  vault: string;
  transactions: EarnTransaction[];
}): EarnDepositResult {
  const { descriptor, network, amount, product, vault, transactions } = params;
  return {
    family: "evm",
    account: descriptor.id,
    network,
    amount,
    product: product.id,
    dryRun: true,
    status: "dry-run: approve validated; deposit needs an on-chain allowance to simulate",
    transactions: [
      ...transactions,
      {
        kind: "deposit",
        to: vault,
        status: "not-simulated (broadcast the approve first to raise the allowance)",
      },
    ],
  };
}

/**
 * Deposit into a Kiln ERC-4626 vault. See module doc for the intended flow. Orchestrates the two
 * on-chain steps — `runApprove` (raise the ERC-20 allowance if needed) then `runDeposit` — with a
 * dry-run short-circuit when an approve is still pending.
 */
export async function depositEvm(params: DepositEvmParams): Promise<EarnDepositResult> {
  const { descriptor, network, productId, amount, dryRun, wallet, out, device } = params;
  const product = normalizeDefiProduct(resolveDefiProduct(await getDefiProducts(), productId));
  assertVaultDepositable(product);
  assertAccountMatchesProductChain(descriptor, product);
  assertAmountTickerMatchesAsset(amount, product);
  const decimals = requireAssetDecimals(product);
  const amountBaseUnits = parseAmountToBaseUnits(amount, decimals);
  const vault = requireVault(product);
  const asset = requireAsset(product);
  const expectedChainId = requireChainId(product);
  const request = buildDepositRequest({ descriptor, product, amount: amountBaseUnits });
  const ctx: EvmDepositContext = {
    descriptor,
    request,
    expectedChainId,
    dryRun,
    wallet,
    out,
    device,
  };

  const { approveRequired, approveTx } = await runApprove(ctx, asset);
  const transactions: EarnTransaction[] = approveTx ? [approveTx] : [];

  if (dryRun && approveRequired) {
    return pendingApproveDryRunResult({
      descriptor,
      network,
      amount,
      product,
      vault,
      transactions,
    });
  }

  const depositTx = await runDeposit(ctx, vault);
  transactions.push(depositTx);

  return {
    family: "evm",
    account: descriptor.id,
    network,
    amount,
    product: product.id,
    dryRun,
    status: dryRun ? "dry-run" : depositTx.status || "broadcasted",
    transactions,
  };
}

/**
 * Withdraw (redeem) from a Kiln ERC-4626 vault. See module doc for the intended flow.
 */
export async function withdrawEvm(params: WithdrawEvmParams): Promise<EarnWithdrawResult> {
  const { descriptor, network, productId, amount, dryRun, wallet, out, device } = params;
  const product = normalizeDefiProduct(resolveDefiProduct(await getDefiProducts(), productId));
  assertAccountMatchesProductChain(descriptor, product);

  // A full exit (no --amount) sends the `"max"` sentinel so the backend redeems the entire share
  // balance with no dust. The ticker/decimals validation only applies to user-supplied amounts, so
  // it is skipped for the full-exit path.
  let amountForRequest: string;
  if (amount === undefined) {
    amountForRequest = "max";
  } else {
    assertAmountTickerMatchesAsset(amount, product);
    const decimals = requireAssetDecimals(product);
    amountForRequest = parseAmountToBaseUnits(amount, decimals);
  }

  const request = buildWithdrawRequest({ descriptor, product, amount: amountForRequest });
  const withdraw = await postDefiWithdraw(request);
  const withdrawData = normalizeDefiTransaction(withdraw.data);
  assertEvmVaultTransactionSafety(
    withdrawData,
    accountAddress(descriptor),
    requireVault(product),
    requireChainId(product),
    "withdraw",
  );

  const withdrawTx = await runEvmVaultIntent({
    wallet,
    descriptor,
    tx: withdrawData,
    kind: "redeem",
    dryRun,
    device,
    out,
  });
  if (!dryRun && withdrawTx.hash) {
    const redeemStatus = await pollEthTransactionStatus(withdrawTx.hash, { out, label: "redeem" });
    withdrawTx.status = resolveTerminalTxStatus(redeemStatus, {
      hash: withdrawTx.hash,
      label: "Redeem",
    });
  }

  return {
    family: "evm",
    account: descriptor.id,
    network,
    // For a full exit we don't know the exact redeemed asset amount up front (the backend redeems
    // the whole share balance), so surface a clear label instead of an asset figure.
    amount: amount ?? "max (full balance)",
    product: product.id,
    dryRun,
    status: dryRun ? "dry-run" : withdrawTx.status || "broadcasted",
    transactions: [withdrawTx],
  };
}
