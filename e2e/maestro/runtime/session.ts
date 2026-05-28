import type { PartialFeatures } from "@shared/feature-flags";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";
import { swapSetup as bridgeSwapSetup } from "../../mobile/bridge/server";
import { MaestroContext } from "../context";
import { setupE2EEnvironment } from "./bridge";
import { CliCommandOnApp, runCliCommandsOnApp } from "./cli";
import { SpeculosName } from "../devices/speculos";

export type SessionOptions = {
  userdata: string;
  mainSpeculos: {
    name: SpeculosName;
    deps?: SpeculosName[];
    testName: string;
  };
  featureFlags?: PartialFeatures;
  cliCommandsOnApp?: CliCommandOnApp[];
  launchArgs?: Record<string, string | number | boolean>;
  swapSetup?: boolean;
};

export type SessionHandles = {
  speculosPort: number;
  speculosAddress: string;
  bridgePort: number;
};

export async function withMaestroSession(
  ctx: MaestroContext,
  options: SessionOptions,
  body: (handles: SessionHandles) => Promise<void>,
): Promise<void> {
  setupE2EEnvironment();
  ctx.app.install();

  if (options.cliCommandsOnApp) {
    await runCliCommandsOnApp(ctx, options.cliCommandsOnApp);
  }

  const main = options.mainSpeculos;
  const speculos = main.deps?.length
    ? await ctx.speculos.startExchangeWith(main.deps, main.testName)
    : await ctx.speculos.start(main.name, main.testName);
  ctx.speculos.reversePort(speculos.port);
  ctx.speculos.registerForCli(speculos.port);
  const speculosAddress = ctx.speculos.address(speculos.port);

  let bridgeOpened = false;
  try {
    // Start the bridge listener and grab the port; `ready` only resolves once
    // the app connects + loadConfig completes, so we must launch the app
    // between getting the port and awaiting `ready`.
    const { port: bridgePort, ready } = await ctx.bridge.start({
      userdata: options.userdata,
      knownSpeculosAddress: speculosAddress,
    });
    bridgeOpened = true;

    await ctx.app.launch({
      IS_TEST: "true",
      mock: "0",
      disable_broadcast: "1",
      wsPort: String(bridgePort),
      ...options.launchArgs,
    });

    await ready;

    if (options.featureFlags) {
      await ctx.bridge.setFeatureFlags(options.featureFlags);
    }

    if (options.swapSetup) {
      await bridgeSwapSetup();
      // Maestro on iOS can't drive the modular drawer when it renders as a
      // sheet over the swap WebView (XCUITest crashes querying that view
      // hierarchy on iOS 18+). Bypass the drawer for live-app account picks
      // by auto-resolving the first matching account in the wallet-api
      // handler. Detox tests don't go through this path because they don't
      // set `swapSetup` here — they drive the drawer themselves.
      await ctx.bridge.setAutoPickAccount(true);
    }

    await body({
      speculosPort: speculos.port,
      speculosAddress,
      bridgePort,
    });
  } finally {
    if (bridgeOpened) {
      await ctx.bridge.removeKnownSpeculos(speculosAddress).catch(() => undefined);
    }
    try {
      await ctx.speculos.cleanup();
    } catch (error) {
      console.warn("[session] Speculos cleanup failed:", sanitizeError(error));
    }
    if (bridgeOpened) {
      ctx.bridge.close();
    }
  }
}
