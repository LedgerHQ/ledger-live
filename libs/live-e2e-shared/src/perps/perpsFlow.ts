import { stopSpeculos, type SpeculosDevice } from "../speculos";
import { resolveDriverAccount, startDriverSpeculos, setSpeculosApiPort } from "../speculosDriver";
import { HyperliquidSpeculosSigner } from "./hyperliquidSpeculos";
import { PerpsApi } from "./perpsApi";
import { PerpsRunner, type PerpsFlowOptions } from "./perpsRunner";

export type { PerpsFlow, PerpsFlowOptions } from "./perpsRunner";

const DEFAULT_ACCOUNT = "HYPERCORE_1";

/** Positions and orders of `address`, read without signing. */
export async function readPerpsState(address: string, apiUrl?: string) {
  const api = new PerpsApi(apiUrl);
  const [positions, orders] = await Promise.all([
    api.getPositions(address),
    api.getOrders(address),
  ]);
  return { positions, orders };
}

export type ClosePerpsMarketsOptions = {
  address: string;
  /** Other markets keep their positions. */
  marketIds: string[];
  /** A running Speculos already on the Hyperliquid app. */
  speculosApiPort: number;
  derivationPath: string;
  apiUrl?: string;
};

/** Closes `marketIds` on a running Speculos, then waits. */
export async function closePerpsMarkets(options: ClosePerpsMarketsOptions): Promise<void> {
  if (options.marketIds.length === 0) return;
  const signer = await HyperliquidSpeculosSigner.open(
    options.speculosApiPort,
    options.derivationPath,
  );
  try {
    const runner = new PerpsRunner(new PerpsApi(options.apiUrl), signer, {
      flow: "sweep",
      address: options.address,
    });
    await runner.closeMarkets(options.marketIds);
  } catch (error) {
    throw new Error(
      `Perps cleanup failed for ${options.address} on ${options.marketIds.join(", ")}; ` +
        "run `pnpm e2e-cli perps sweep` to close them",
      { cause: error },
    );
  } finally {
    await signer.close();
  }
}

/** Runs one CLI flow: status, sweep or sign-check. */
export async function runPerps(options: PerpsFlowOptions): Promise<void> {
  if (options.flow === "status") {
    console.log(JSON.stringify(await readPerpsState(options.address, options.apiUrl), null, 2));
    return;
  }
  const { path } = resolveDriverAccount(options.account ?? DEFAULT_ACCOUNT);

  let device: SpeculosDevice | undefined;
  try {
    let apiPort = options.speculosApiPort;
    if (apiPort === undefined) {
      device = await startDriverSpeculos({
        name: `perps-${options.flow}`,
        suite: "perps",
        specKey: "Hyperliquid",
        nanoAppCatalogPath: options.nanoAppCatalogPath,
      });
      apiPort = device.port;
    }
    setSpeculosApiPort(apiPort);

    const signer = await HyperliquidSpeculosSigner.open(apiPort, path);
    try {
      const runner = new PerpsRunner(new PerpsApi(options.apiUrl), signer, options);
      if (options.flow === "sweep") await runner.sweep();
      else await runner.signCheck();
    } finally {
      await signer.close();
    }
  } finally {
    if (device) await stopSpeculos(device.id);
  }
}
