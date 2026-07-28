import {
  DEFAULT_RPC_URL,
  runBorrow,
  type BorrowFlowOptions,
  type Flow,
} from "../borrow/borrowFlow";

const FLOWS: Flow[] = ["open", "close", "repay", "withdraw"];
const FLOW_SET = new Set<string>(FLOWS);
const isFlow = (v: string | undefined): v is Flow => v !== undefined && FLOW_SET.has(v);

function parseArgs(argv: string[]): BorrowFlowOptions {
  const flow = argv[0];
  if (!isFlow(flow))
    throw new Error("Usage: pnpm e2e-cli borrow <open|close|repay|withdraw> [options]");

  const get = (name: string): string | undefined => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const has = (name: string): boolean => argv.includes(`--${name}`);

  const rpcUrl = get("rpc") ?? process.env.EVM_RPC_URL ?? DEFAULT_RPC_URL;

  return {
    flow,
    rpcUrl,
    account: get("account") ?? "ETH_4",
    dryRun: has("dry-run"),
    force: has("force"),
    all: has("all"),
    marketId: get("market-id"),
    collateralAmount: get("collateral-amount"),
    loanAmount: get("loan-amount"),
    repayAmount: get("repay-amount"),
    withdrawAmount: get("withdraw-amount"),
    nanoAppCatalogPath: get("catalog"),
  };
}

export async function runBorrowCommand(argv: string[]): Promise<void> {
  await runBorrow(parseArgs(argv));
}
