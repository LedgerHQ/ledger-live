import { DeviceManagementKitTransportSpeculos } from "@ledgerhq/live-dmk-speculos";
import { enableBlindSigning, stopSpeculos, type SpeculosDevice } from "../speculos";
import { resolveDriverAccount, startDriverSpeculos, setSpeculosApiPort } from "../speculosDriver";
import {
  DEFAULT_MARKET_ID,
  ETHEREUM_CHAIN_ID,
  findPositions,
  getPositions,
  pollAction,
  postAction,
  submitTransaction,
  type ActionRequest,
} from "./borrowApi";
import { EvmSpeculosExecutor } from "./evmSpeculos";
import type { EvmSignablePayload, OpenLoan } from "./types";

// Public, keyless Ethereum mainnet RPC used when neither --rpc nor EVM_RPC_URL is set.
export const DEFAULT_RPC_URL = "https://ethereum-rpc.publicnode.com";

export type Flow = "open" | "close" | "repay" | "withdraw" | "address";

export interface BorrowFlowOptions {
  flow: Flow;
  /** Ethereum mainnet RPC used to build (gas/nonce) and broadcast the signed tx. */
  rpcUrl: string;
  /** Account enum key, e.g. "ETH_4". */
  account?: string;
  /** Sign but do not broadcast. */
  dryRun?: boolean;
  /** Open even if a position already exists. */
  force?: boolean;
  /** Act on every open position, not just the first. */
  all?: boolean;
  /**
   * Reuse an already-running Speculos on this API port instead of booting one.
   * When set, the caller owns the device lifecycle and on-device approval.
   */
  speculosApiPort?: number;
  /** Speculos nano-app-version catalog path; sets E2E_NANO_APP_VERSION_PATH when booting own Speculos. */
  nanoAppCatalogPath?: string;
  marketId?: string;
  collateralAmount?: string;
  loanAmount?: string;
  repayAmount?: string;
  withdrawAmount?: string;
  requireAction?: boolean;
  returnAddress?: boolean;
}

export type BorrowFlowOptionsWithoutAddress = Omit<BorrowFlowOptions, "returnAddress">;

const positive = (v?: string): boolean => v != null && Number.parseFloat(v) > 0;

type RunActionOptions = { executor: EvmSpeculosExecutor; body: ActionRequest; dryRun: boolean };

/** Posts an action and signs+broadcasts each returned step on Speculos. */
async function runAction(options: RunActionOptions): Promise<void> {
  const { executor, body, dryRun } = options;
  console.log(`→ ${body.action} action (${JSON.stringify(body.args)})`);
  const action = await postAction(body);
  for (let i = 0; i < action.steps.length; i++) {
    const step = action.steps[i];
    const payload: EvmSignablePayload = JSON.parse(step.signablePayload);
    console.log(`  · step ${i + 1}/${action.steps.length} (${step.actionType}) → signing`);
    const { signedHex, hash } = await executor.buildSignBroadcast(payload, dryRun);
    if (dryRun) {
      console.log(`    dry-run signed: ${signedHex.slice(0, 42)}…`);
      continue;
    }
    if (!hash) throw new Error("Broadcast returned no hash");
    console.log(`    broadcast: ${hash}`);
    await submitTransaction({ transactionId: step.transactionId, txHash: hash });
  }
  if (!dryRun) await pollAction(action.actionId);
}

async function open(
  executor: EvmSpeculosExecutor,
  address: string,
  opts: BorrowFlowOptions,
): Promise<void> {
  // Always open USDT loans: default to the WBTC/USDT market unless explicitly overridden.
  const marketId = opts.marketId ?? DEFAULT_MARKET_ID;
  if (!opts.collateralAmount || !opts.loanAmount) {
    throw new Error("open requires --collateral-amount and --loan-amount");
  }
  if (!opts.force) {
    const positions = findPositions(await getPositions(address));
    if (positions.some(loan => positive(loan.debtBalance))) {
      console.log("Loan with debt already open — skipping. Use --force.");
      return;
    }
    if (positions.length > 0) {
      console.log(
        "Collateral-only position found — skipping open. Reset loan state before ensureLoanOpen.",
      );
      return;
    }
  }
  const dryRun = opts.dryRun ?? false;
  console.log(`Opening loan on market=${marketId}`);
  await runAction({
    executor,
    body: { address, action: "supply", args: { marketId, amount: opts.collateralAmount } },
    dryRun,
  });
  await runAction({
    executor,
    body: { address, action: "borrow", args: { marketId, amount: opts.loanAmount } },
    dryRun,
  });
  console.log("✔ open complete");
}

/** Whether a flow has anything to do on a position, given its balances. */
function relevantToFlow(flow: Flow, loan: OpenLoan): boolean {
  if (flow === "repay") return positive(loan.debtBalance);
  if (flow === "withdraw") return positive(loan.collateralBalance);
  return positive(loan.debtBalance) || positive(loan.collateralBalance); // close
}

function nothingToDoMessage(flow: Flow): string {
  if (flow === "repay") return "Nothing to repay — no debt for this account.";
  if (flow === "withdraw") return "Nothing to withdraw — no collateral supplied for this account.";
  return "Nothing to close — no open position for this account.";
}

type CloseOneOptions = {
  executor: EvmSpeculosExecutor;
  address: string;
  loan: OpenLoan;
  opts: BorrowFlowOptions;
};

async function closeOne(options: CloseOneOptions): Promise<void> {
  const { executor, address, loan, opts } = options;
  const dryRun = opts.dryRun ?? false;
  // An explicit `--market-id` carries no balances, so trust the flow flag.
  const explicit = loan.debtBalance === undefined && loan.collateralBalance === undefined;

  if (
    (opts.flow === "close" || opts.flow === "repay") &&
    (explicit || positive(loan.debtBalance))
  ) {
    const args = opts.repayAmount
      ? { marketId: loan.marketId, amount: opts.repayAmount }
      : { marketId: loan.marketId, repayAll: true };
    await runAction({ executor, body: { address, action: "repay", args }, dryRun });
  }
  if (
    (opts.flow === "close" || opts.flow === "withdraw") &&
    (explicit || positive(loan.collateralBalance) || opts.withdrawAmount != null)
  ) {
    // The API requires an explicit amount for withdraw (no `withdrawAll`);
    // default to the full collateral balance from the position.
    const amount = opts.withdrawAmount ?? loan.collateralBalance;
    if (!amount)
      throw new Error("withdraw requires --withdraw-amount (collateral balance unavailable)");
    await runAction({
      executor,
      body: { address, action: "withdraw", args: { marketId: loan.marketId, amount } },
      dryRun,
    });
  }
}

async function close(
  executor: EvmSpeculosExecutor,
  address: string,
  opts: BorrowFlowOptions,
): Promise<void> {
  let loans: OpenLoan[];
  if (opts.marketId) {
    loans = [{ marketId: opts.marketId }];
  } else {
    loans = findPositions(await getPositions(address)).filter(loan =>
      relevantToFlow(opts.flow, loan),
    );
    if (loans.length === 0) {
      const message = nothingToDoMessage(opts.flow);
      if (opts.requireAction) throw new Error(message);
      console.log(message);
      return;
    }
    if (!opts.all) {
      if (loans.length > 1) {
        console.log(`Found ${loans.length} positions — acting on the first; pass --all for all.`);
      }
      loans = [loans[0]];
    }
  }

  for (const loan of loans) {
    console.log(`— ${opts.flow} market=${loan.marketId}`);
    await closeOne({ executor, address, loan, opts });
  }
  console.log(`✔ ${opts.flow} complete (${loans.length} position(s))`);
}

/**
 * Runs a Borrow flow end-to-end, signing on Speculos. Safe to call from
 * Playwright `beforeAll` / `afterAll` hooks — it never calls `process.exit`,
 * awaits fully, and cleans up the device + RPC sockets it created.
 *
 * By default it boots (and tears down) its own Speculos using `SEED` +
 * `COINAPPS`. Pass `speculosApiPort` to reuse an already-running device (the
 * caller then owns its lifecycle and on-device approval).
 */
export function runBorrow(
  options: BorrowFlowOptionsWithoutAddress & { returnAddress: true },
): Promise<string>;
export function runBorrow(options: BorrowFlowOptionsWithoutAddress): Promise<void>;
export async function runBorrow(options: BorrowFlowOptions): Promise<string | void> {
  // SEED is sourced from the environment only — never a CLI flag, never logged.
  const { path, specKey } = resolveDriverAccount(options.account ?? "ETH_4");

  const ownSpeculos = options.speculosApiPort === undefined;
  let device: SpeculosDevice | undefined;
  let apiPort = options.speculosApiPort;

  try {
    if (ownSpeculos) {
      device = await startDriverSpeculos({
        name: `borrow-${options.flow}`,
        suite: "borrow",
        specKey,
        nanoAppCatalogPath: options.nanoAppCatalogPath,
      });
      apiPort = device.port;
    }
    if (apiPort === undefined) throw new Error("Speculos API port unavailable");
    setSpeculosApiPort(apiPort);

    // Morpho calldata has no clear-signing descriptor, so the app answers 6a80 until this is
    // on. Only for a device we booted; a caller that passed its own port owns its settings.
    if (ownSpeculos) await enableBlindSigning();

    const transport = await DeviceManagementKitTransportSpeculos.open({ apiPort: String(apiPort) });
    const executor = new EvmSpeculosExecutor(transport, {
      rpcUrl: options.rpcUrl,
      chainId: ETHEREUM_CHAIN_ID,
      path,
      speculosApiPort: apiPort,
    });
    try {
      const address = await executor.getAddress();
      console.log(`Account ${options.account ?? "ETH_4"}: ${address} (Ethereum, staging)`);
      if (options.flow === "address") {
        if (options.returnAddress) return address;
        return;
      }
      if (options.flow === "open") {
        await open(executor, address, options);
      } else {
        await close(executor, address, options);
      }
      if (options.returnAddress) return address;
    } finally {
      executor.dispose();
    }
  } finally {
    if (device) await stopSpeculos(device.id);
  }
}

export const closeBorrowPosition = (
  options: Omit<BorrowFlowOptionsWithoutAddress, "flow">,
): Promise<void> => runBorrow({ ...options, flow: "close" });
