import type { PerpsFlow, PerpsFlowOptions } from "../perps/perpsRunner";

const FLOWS = new Set<string>(["status", "sweep", "sign-check"]);
const isFlow = (value: string | undefined): value is PerpsFlow =>
  value !== undefined && FLOWS.has(value);

const USAGE =
  "Usage: pnpm e2e-cli perps <status|sweep|sign-check> --address <0x…> [--dry-run] [options]";

function parsePort(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0) throw new Error(`Invalid --speculos-port "${value}"`);
  return port;
}

export function parsePerpsArgs(argv: string[]): PerpsFlowOptions {
  const flow = argv[0];
  if (!isFlow(flow)) throw new Error(USAGE);
  const get = (name: string): string | undefined => {
    const index = argv.indexOf(`--${name}`);
    if (index < 0) return undefined;
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--"))
      throw new Error(`Missing value for --${name}`);
    return value;
  };
  const address = get("address");
  if (!address) throw new Error(`Missing --address\n${USAGE}`);
  return {
    flow,
    address,
    account: get("account") ?? "HYPERCORE_1",
    dryRun: argv.includes("--dry-run"),
    speculosApiPort: parsePort(get("speculos-port")),
    nanoAppCatalogPath: get("catalog"),
    apiUrl: get("api-url"),
    marketId: get("market-id"),
  };
}

export async function runPerpsCommand(argv: string[]): Promise<void> {
  // Loaded lazily, so the unit tests skip the Speculos imports.
  const { runPerps } = await import("../perps/perpsFlow.js");
  await runPerps(parsePerpsArgs(argv));
}
