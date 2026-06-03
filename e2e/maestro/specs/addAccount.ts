import { MaestroContext } from "../context";
import { withMaestroSession } from "../runtime/session";

export async function runAddAccountSpec(ctx: MaestroContext) {
  await withMaestroSession(
    ctx,
    {
      userdata: "skip-onboarding",
      mainSpeculos: { name: "Bitcoin", testName: "maestro-add-account" },
    },
    async () => {
      // Build the YAML flow.
      await ctx.app.openDeepLink("ledgerlive://portfolio");
      await ctx.portfolio.openAddAccount();

      ctx.modularDrawer.selectAssetForAddAccount("BTC");
      ctx.modularDrawer.confirmAddAccount();
      ctx.portfolio.expectAsset("Bitcoin");

      // Run it
      await ctx.runFlow("add-account");
    },
  );
}
