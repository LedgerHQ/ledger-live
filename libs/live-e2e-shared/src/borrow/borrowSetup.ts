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

const cachedBorrowAddresses = new Map<string, string>();

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

async function waitForPartnerWithdrawReady(address: string): Promise<void> {
  const deadline = Date.now() + PARTNER_INDEX_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const loans = findPositions(await getPositions(address));
    if (loans.some(isWithdrawReady)) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, PARTNER_INDEX_POLL_MS));
  }
  const loans = findPositions(await getPositions(address));
  throw new Error(
    `Partner Borrow API never indexed withdraw-ready state for ${address} within ${PARTNER_INDEX_TIMEOUT_MS}ms: ${JSON.stringify(loans)}`,
  );
}

async function waitForPartnerLoanDebt(address: string): Promise<void> {
  const deadline = Date.now() + PARTNER_INDEX_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const loans = findPositions(await getPositions(address));
    if (loans.some(loan => positive(loan.debtBalance))) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, PARTNER_INDEX_POLL_MS));
  }
  const loans = findPositions(await getPositions(address));
  throw new Error(
    `Partner Borrow API never indexed loan debt for ${address} within ${PARTNER_INDEX_TIMEOUT_MS}ms: ${JSON.stringify(loans)}`,
  );
}

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
}
