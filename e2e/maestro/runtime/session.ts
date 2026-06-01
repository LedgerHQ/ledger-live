import type { PartialFeatures } from "@shared/feature-flags";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";
import { swapSetup as bridgeSwapSetup } from "../../mobile/bridge/server";
import { MaestroContext } from "../context";
import { setupE2EEnvironment } from "./env";
import { createTempUserdata, removeTempUserdata } from "./userdata";
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

export async function withMaestroSession(
  ctx: MaestroContext,
  options: SessionOptions,
  body: () => Promise<void>,
): Promise<void> {
  setupE2EEnvironment();
  ctx.app.install();

  const tmpUserdata = createTempUserdata(options.userdata);

  let bridgeOpened = false;
  let speculosAddress: string | undefined;
  try {
    if (options.cliCommandsOnApp) {
      await runCliCommandsOnApp(ctx, options.cliCommandsOnApp, tmpUserdata.path);
    }

    const main = options.mainSpeculos;
    const speculos = main.deps?.length
      ? await ctx.speculos.startExchangeWith(main.deps, main.testName)
      : await ctx.speculos.start(main.name, main.testName);
    ctx.speculos.reversePort(speculos.port);
    ctx.speculos.registerForCli(speculos.port);
    speculosAddress = ctx.speculos.address(speculos.port);

    const { port: bridgePort, ready } = await ctx.bridge.start({
      userdata: tmpUserdata.name,
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
      await ctx.bridge.setAutoPickAccount(true);
    }

    await body();
  } finally {
    if (bridgeOpened && speculosAddress) {
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
    removeTempUserdata(tmpUserdata.path);
  }
}
