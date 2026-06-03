import type { PartialFeatures } from "@shared/feature-flags";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";
import { swapSetup as bridgeSwapSetup } from "../../mobile/bridge/server";
import { MaestroContext } from "../context";
import { setupE2EEnvironment } from "./env";
import { createTempUserdata, removeTempUserdata } from "./userdata";
import { CliCommandOnApp, runCliCommandsOnApp } from "./cli";
import { timed } from "./timing";
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
  const installed = ctx.app.install();
  installed.catch(() => undefined);

  const tmpUserdata = createTempUserdata(options.userdata);

  let bridgeOpened = false;
  let speculosAddress: string | undefined;
  try {
    const cliCommands = options.cliCommandsOnApp;
    if (cliCommands) {
      await timed("cli-setup", () => runCliCommandsOnApp(ctx, cliCommands, tmpUserdata.path));
    }

    const main = options.mainSpeculos;
    const speculos = await timed("speculos-start", () =>
      main.deps?.length
        ? ctx.speculos.startExchangeWith(main.deps, main.testName)
        : ctx.speculos.start(main.name, main.testName),
    );
    ctx.speculos.reversePort(speculos.port);
    ctx.speculos.registerForCli(speculos.port);
    speculosAddress = ctx.speculos.address(speculos.port);

    const { port: bridgePort, ready } = await timed("bridge-start", () =>
      ctx.bridge.start({
        userdata: tmpUserdata.name,
        knownSpeculosAddress: speculosAddress,
      }),
    );
    bridgeOpened = true;

    await timed("app-install", () => installed);

    await timed("app-launch", () =>
      ctx.app.launch({
        IS_TEST: "true",
        mock: "0",
        disable_broadcast: "1",
        wsPort: String(bridgePort),
        ...options.launchArgs,
      }),
    );

    await timed("bridge-ready", () => ready);

    const featureFlags = options.featureFlags;
    if (featureFlags) {
      await timed("feature-flags", () => ctx.bridge.setFeatureFlags(featureFlags));
    }

    if (options.swapSetup) {
      await timed("swap-setup", () => bridgeSwapSetup());
    }

    await timed("test-body", () => body());
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
