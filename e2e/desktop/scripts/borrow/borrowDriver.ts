import { runBorrow, type BorrowFlowOptions, type Flow } from "./borrowFlow";

const FLOWS: Flow[] = ["open", "close", "repay", "withdraw"];
function isFlow(v: string | undefined): v is Flow {
  return FLOWS.some(f => f === v);
}

function parseArgs(argv: string[]): BorrowFlowOptions {
  const flow = argv[0];
  if (!isFlow(flow)) throw new Error("Usage: borrow <open|close|repay|withdraw> [options]");

  const get = (name: string): string | undefined => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const has = (name: string): boolean => argv.includes(`--${name}`);

  const rpcUrl = get("rpc") ?? process.env.EVM_RPC_URL;
  if (!rpcUrl) throw new Error("Missing --rpc <url> (or EVM_RPC_URL)");

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
  };
}

runBorrow(parseArgs(process.argv.slice(2)))
  .then(() => process.exit(process.exitCode ?? 0))
  .catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
