import { MaestroContext } from "../context";
import { setupE2EEnvironment } from "../runtime/bridge";

export async function runAddAccountSpec(ctx: MaestroContext) {
  setupE2EEnvironment();
  ctx.app.install();

  const speculos = await ctx.speculos.start("Bitcoin", "maestro-add-account");
  ctx.speculos.reversePort(speculos.port);
  const speculosAddress = ctx.speculos.address(speculos.port);

  const bridgeSetup = ctx.bridge.start({
    userdata: "skip-onboarding",
    knownSpeculosAddress: speculosAddress,
  });

  try {
    await ctx.app.launch({
      IS_TEST: "true",
      mock: "0",
      disable_broadcast: "1",
      wsPort: "8099",
    });
    ctx.app.openDeepLink("ledgerlive://portfolio");
    await bridgeSetup;
    ctx.portfolio.openAddAccount();

    await ctx.modularDrawer.selectAssetForAddAccount("BTC");
    await ctx.modularDrawer.confirmAddAccount();
    await ctx.portfolio.expectAsset("Bitcoin");
  } finally {
    await ctx.bridge.removeKnownSpeculos(speculosAddress).catch(() => undefined);
    await ctx.speculos.cleanup();
    ctx.bridge.close();
  }
}
