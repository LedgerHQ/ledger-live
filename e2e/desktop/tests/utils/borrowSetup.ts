import {
  openBorrowPosition,
  closeBorrowPosition,
  DEFAULT_RPC_URL,
} from "../../scripts/borrow/borrowFlow";

const DEFAULT_ACCOUNT = "ETH_4";
const DEFAULT_COLLATERAL = "0.0002"; // wBTC
const DEFAULT_LOAN = "1"; // USDT

export interface BorrowSetupOptions {
  account?: string;
  rpcUrl?: string;
  collateralAmount?: string;
  loanAmount?: string;
  marketId?: string;
}

const broadcastEnabled = (): boolean => process.env.DISABLE_TRANSACTION_BROADCAST === "0";

const resolveRpc = (rpcUrl?: string): string =>
  rpcUrl ?? process.env.EVM_RPC_URL ?? DEFAULT_RPC_URL;

/**
 * `beforeAll` precondition for withdraw / close-loan specs: signs a real loan open on Speculos so
 * the UI has a position to act on. No-op if a loan is already open, or if broadcast is disabled.
 */
export async function ensureLoanOpen(options: BorrowSetupOptions = {}): Promise<void> {
  if (!broadcastEnabled()) {
    console.log("[borrowSetup] DISABLE_TRANSACTION_BROADCAST !== 0 — skipping ensureLoanOpen");
    return;
  }
  await openBorrowPosition({
    account: options.account ?? DEFAULT_ACCOUNT,
    rpcUrl: resolveRpc(options.rpcUrl),
    collateralAmount: options.collateralAmount ?? DEFAULT_COLLATERAL,
    loanAmount: options.loanAmount ?? DEFAULT_LOAN,
    marketId: options.marketId,
  });
}

/**
 * `beforeAll` / `afterAll` reset for the open-loan spec: repays + withdraws every open position so
 * the account returns to zero and each run starts from the same state. No-op if nothing is open, or
 * if broadcast is disabled. Requires the account to hold the debt token plus accrued interest.
 */
export async function resetLoanState(options: BorrowSetupOptions = {}): Promise<void> {
  if (!broadcastEnabled()) {
    console.log("[borrowSetup] DISABLE_TRANSACTION_BROADCAST !== 0 — skipping resetLoanState");
    return;
  }
  await closeBorrowPosition({
    account: options.account ?? DEFAULT_ACCOUNT,
    rpcUrl: resolveRpc(options.rpcUrl),
    all: true,
  });
}
