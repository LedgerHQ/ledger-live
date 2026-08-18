import { JsonRpcProvider } from "ethers";
import { findPositions, getPositions } from "./borrowApi";
import { closeBorrowPosition, runBorrow, DEFAULT_RPC_URL } from "./borrowFlow";
import type { OpenLoan } from "./types";

export const DEFAULT_ACCOUNT = "ETH_4";
export const DEFAULT_COLLATERAL = "0.0002";
export const DEFAULT_LOAN = "1";

export interface BorrowSetupOptions {
  account?: string;
  rpcUrl?: string;
  collateralAmount?: string;
  loanAmount?: string;
  marketId?: string;
  nanoAppCatalogPath?: string;
}

const broadcastEnabled = (): boolean => process.env.DISABLE_TRANSACTION_BROADCAST === "0";

const resolveRpc = (rpcUrl?: string): string =>
  rpcUrl ?? process.env.EVM_RPC_URL ?? DEFAULT_RPC_URL;

const positive = (v?: string): boolean => v != null && Number.parseFloat(v) > 0;

const isWithdrawReady = (loan: OpenLoan): boolean =>
  !positive(loan.debtBalance) && positive(loan.collateralBalance);

const PARTNER_INDEX_POLL_MS = 3_000;
const PARTNER_INDEX_TIMEOUT_MS = 180_000;

const NONCE_SETTLE_POLL_MS = 2_000;
const NONCE_SETTLE_TIMEOUT_MS = 120_000;

const cachedBorrowAddresses = new Map<string, string>();

export const peekBorrowAddress = (account: string = DEFAULT_ACCOUNT): string | undefined =>
  cachedBorrowAddresses.get(account);

export interface AccountNonces {
  latest: number;
  pending: number;
}

export async function readAccountNonces(address: string, rpcUrl?: string): Promise<AccountNonces> {
  const provider = new JsonRpcProvider(resolveRpc(rpcUrl));
  try {
    const [latest, pending] = await Promise.all([
      provider.getTransactionCount(address, "latest"),
      provider.getTransactionCount(address, "pending"),
    ]);
    return { latest, pending };
  } finally {
    provider.destroy();
  }
}

export async function waitForChainNonceSettled(options: BorrowSetupOptions = {}): Promise<void> {
  if (!broadcastEnabled()) return;

  const address = await resolveBorrowAddress(options);
  const deadline = Date.now() + NONCE_SETTLE_TIMEOUT_MS;
  let nonces = await readAccountNonces(address, options.rpcUrl);

  while (Date.now() < deadline) {
    if (nonces.latest === nonces.pending) {
      console.log(`[borrowSetup] Chain nonce settled at ${nonces.latest} for ${address}`);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, NONCE_SETTLE_POLL_MS));
    nonces = await readAccountNonces(address, options.rpcUrl);
  }

  throw new Error(
    `Account ${address} still has transactions in flight after ${NONCE_SETTLE_TIMEOUT_MS}ms ` +
      `(latest nonce ${nonces.latest}, pending ${nonces.pending}) — another process is likely using it`,
  );
}

const borrowSetupContext = (options: BorrowSetupOptions) => ({
  account: options.account ?? DEFAULT_ACCOUNT,
  rpcUrl: resolveRpc(options.rpcUrl),
  nanoAppCatalogPath: options.nanoAppCatalogPath,
});

async function resolveBorrowAddress(options: BorrowSetupOptions): Promise<string> {
  const { account, rpcUrl, nanoAppCatalogPath } = borrowSetupContext(options);
  const cached = cachedBorrowAddresses.get(account);
  if (cached) return cached;
  const address = await runBorrow({
    account,
    rpcUrl,
    nanoAppCatalogPath,
    flow: "address",
    returnAddress: true,
  });
  if (typeof address !== "string") {
    throw new TypeError("resolveBorrowAddress: missing borrow account address");
  }
  cachedBorrowAddresses.set(account, address);
  return address;
}

async function waitForPartnerState(
  address: string,
  isReady: (loan: OpenLoan) => boolean,
  expectedState: string,
): Promise<void> {
  const deadline = Date.now() + PARTNER_INDEX_TIMEOUT_MS;
  let loans = findPositions(await getPositions(address));

  while (Date.now() < deadline) {
    if (loans.some(isReady)) return;
    await new Promise(resolve => setTimeout(resolve, PARTNER_INDEX_POLL_MS));
    loans = findPositions(await getPositions(address));
  }

  throw new Error(
    `Partner Borrow API never indexed ${expectedState} for ${address} within ` +
      `${PARTNER_INDEX_TIMEOUT_MS}ms: ${JSON.stringify(loans)}`,
  );
}

const waitForPartnerWithdrawReady = (address: string): Promise<void> =>
  waitForPartnerState(address, isWithdrawReady, "withdraw-ready state");

const waitForPartnerLoanDebt = (address: string): Promise<void> =>
  waitForPartnerState(address, loan => positive(loan.debtBalance), "loan debt");

export async function ensureLoanOpen(options: BorrowSetupOptions = {}): Promise<void> {
  if (!broadcastEnabled()) {
    console.log("[borrowSetup] DISABLE_TRANSACTION_BROADCAST !== '0' — skipping ensureLoanOpen");
    return;
  }
  const account = options.account ?? DEFAULT_ACCOUNT;
  const rpcUrl = resolveRpc(options.rpcUrl);
  const nanoAppCatalogPath = options.nanoAppCatalogPath;

  const address = await runBorrow({
    account,
    rpcUrl,
    nanoAppCatalogPath,
    flow: "open",
    collateralAmount: options.collateralAmount ?? DEFAULT_COLLATERAL,
    loanAmount: options.loanAmount ?? DEFAULT_LOAN,
    marketId: options.marketId,
    returnAddress: true,
  });
  if (typeof address !== "string") {
    throw new TypeError("ensureLoanOpen: missing borrow account address after open setup");
  }
  await waitForPartnerLoanDebt(address);
  await waitForChainNonceSettled(options);
}

export async function ensureRepayTestPrecondition(options: BorrowSetupOptions = {}): Promise<void> {
  if (!broadcastEnabled()) {
    console.log(
      "[borrowSetup] DISABLE_TRANSACTION_BROADCAST !== '0' — skipping ensureRepayTestPrecondition",
    );
    return;
  }
  const address = await resolveBorrowAddress(options);
  const loans = findPositions(await getPositions(address));
  if (loans.some(loan => positive(loan.debtBalance))) {
    console.log("[borrowSetup] Active loan with debt — skipping reset+open");
    await waitForChainNonceSettled(options);
    return;
  }
  await resetLoanState(options);
  await ensureLoanOpen(options);
}

export async function ensureLoanRepaidForWithdraw(options: BorrowSetupOptions = {}): Promise<void> {
  if (!broadcastEnabled()) {
    console.log(
      "[borrowSetup] DISABLE_TRANSACTION_BROADCAST !== '0' — skipping ensureLoanRepaidForWithdraw",
    );
    return;
  }
  await resetLoanState(options);
  await ensureLoanOpen(options);
  const address = await runBorrow({
    account: options.account ?? DEFAULT_ACCOUNT,
    rpcUrl: resolveRpc(options.rpcUrl),
    nanoAppCatalogPath: options.nanoAppCatalogPath,
    flow: "repay",
    all: true,
    requireAction: true,
    returnAddress: true,
  });
  if (typeof address !== "string") {
    throw new TypeError(
      "ensureLoanRepaidForWithdraw: missing borrow account address after repay setup",
    );
  }
  await waitForPartnerWithdrawReady(address);
  await waitForChainNonceSettled(options);
}

export async function ensureWithdrawReadyForUi(options: BorrowSetupOptions = {}): Promise<void> {
  if (!broadcastEnabled()) {
    console.log(
      "[borrowSetup] DISABLE_TRANSACTION_BROADCAST !== '0' — skipping ensureWithdrawReadyForUi",
    );
    return;
  }
  const { account, rpcUrl, nanoAppCatalogPath } = borrowSetupContext(options);
  const address = await resolveBorrowAddress(options);
  const loans = findPositions(await getPositions(address));

  if (loans.some(isWithdrawReady)) {
    console.log("[borrowSetup] Withdraw-ready position exists — skipping API setup");
    await waitForChainNonceSettled(options);
    return;
  }

  if (loans.some(loan => positive(loan.debtBalance))) {
    console.log("[borrowSetup] Repaying debt via API for withdraw UI");
    await runBorrow({
      account,
      rpcUrl,
      nanoAppCatalogPath,
      flow: "repay",
      all: true,
      requireAction: true,
    });
    await waitForPartnerWithdrawReady(address);
    await waitForChainNonceSettled(options);
    return;
  }

  await ensureLoanRepaidForWithdraw(options);
}

export async function resetLoanState(options: BorrowSetupOptions = {}): Promise<void> {
  if (!broadcastEnabled()) {
    console.log("[borrowSetup] DISABLE_TRANSACTION_BROADCAST !== '0' — skipping resetLoanState");
    return;
  }
  await closeBorrowPosition({
    account: options.account ?? DEFAULT_ACCOUNT,
    rpcUrl: resolveRpc(options.rpcUrl),
    all: true,
    nanoAppCatalogPath: options.nanoAppCatalogPath,
  });
  await waitForChainNonceSettled(options);
}
