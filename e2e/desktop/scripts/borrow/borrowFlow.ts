import { resolve as resolvePath } from "node:path";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { DeviceManagementKitTransportSpeculos } from "@ledgerhq/live-dmk-speculos";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import {
  specs,
  startSpeculos,
  stopSpeculos,
  type SpeculosDevice,
} from "@ledgerhq/live-e2e-shared/speculos";
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

export type Flow = "open" | "close" | "repay" | "withdraw";

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
  marketId?: string;
  collateralAmount?: string;
  loanAmount?: string;
  repayAmount?: string;
  withdrawAmount?: string;
}

const positive = (v?: string): boolean => v != null && Number.parseFloat(v) > 0;

function resolveAccount(name: string): { path: string; specKey: string } {
  const account: unknown = Reflect.get(Account, name);
  if (!(account instanceof Account) || !account.accountPath) {
    throw new Error(`Unknown account "${name}" (expected e.g. ETH_4)`);
  }
  return {
    path: account.accountPath,
    specKey: account.currency.speculosApp.name.replace(/ /g, "_"),
  };
}

/** Posts an action and signs+broadcasts each returned step on Speculos. */
async function runAction(
  executor: EvmSpeculosExecutor,
  body: ActionRequest,
  dryRun: boolean,
): Promise<void> {
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
    await submitTransaction(step.transactionId, hash);
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
  if (!opts.force && findPositions(await getPositions(address)).length > 0) {
    console.log("Position already open — skipping. Use --force.");
    return;
  }
  const dryRun = opts.dryRun ?? false;
  console.log(`Opening loan on market=${marketId}`);
  await runAction(
    executor,
    { address, action: "supply", args: { marketId, amount: opts.collateralAmount } },
    dryRun,
  );
  await runAction(
    executor,
    { address, action: "borrow", args: { marketId, amount: opts.loanAmount } },
    dryRun,
  );
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

async function closeOne(
  executor: EvmSpeculosExecutor,
  address: string,
  loan: OpenLoan,
  opts: BorrowFlowOptions,
): Promise<void> {
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
    await runAction(executor, { address, action: "repay", args }, dryRun);
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
    await runAction(
      executor,
      { address, action: "withdraw", args: { marketId: loan.marketId, amount } },
      dryRun,
    );
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
      console.log(nothingToDoMessage(opts.flow));
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
    await closeOne(executor, address, loan, opts);
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
export async function runBorrow(options: BorrowFlowOptions): Promise<void> {
  // SEED is sourced from the environment only — never a CLI flag, never logged.
  const { path, specKey } = resolveAccount(options.account ?? "ETH_4");

  const ownSpeculos = options.speculosApiPort === undefined;
  let device: SpeculosDevice | undefined;
  let apiPort = options.speculosApiPort;

  try {
    if (ownSpeculos) {
      // startSpeculos reads SEED / COINAPPS from process.env directly (not live-env).
      if (!process.env.SEED) throw new Error("Missing SEED env (Speculos seed)");
      setEnv("MOCK", "");
      process.env.MOCK = "";
      setEnv("PLAYWRIGHT_RUN", true);
      // The Speculos app-version catalog is read via live-env; default it to the
      // checked-in desktop catalog unless the caller already set one.
      if (!getEnv("E2E_NANO_APP_VERSION_PATH")) {
        setEnv(
          "E2E_NANO_APP_VERSION_PATH",
          resolvePath(__dirname, "../../tests/artifacts/appVersion/nano-app-catalog.json"),
        );
      }
      const spec = specs[specKey];
      if (!spec) throw new Error(`No Speculos spec for "${specKey}"`);
      device = await startSpeculos(`borrow-${options.flow}`, spec);
      if (!device) throw new Error("Speculos not started");
      apiPort = device.port;
      setEnv("SPECULOS_API_PORT", device.port);
      process.env.SPECULOS_API_PORT = String(device.port);
    }
    if (apiPort === undefined) throw new Error("Speculos API port unavailable");

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
      if (options.flow === "open") {
        await open(executor, address, options);
      } else {
        await close(executor, address, options);
      }
    } finally {
      executor.dispose();
    }
  } finally {
    if (device) await stopSpeculos(device.id);
  }
}

export const openBorrowPosition = (options: Omit<BorrowFlowOptions, "flow">): Promise<void> =>
  runBorrow({ ...options, flow: "open" });

export const closeBorrowPosition = (options: Omit<BorrowFlowOptions, "flow">): Promise<void> =>
  runBorrow({ ...options, flow: "close" });
