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
      ctx.app.openDeepLink("ledgerlive://portfolio");
      ctx.portfolio.openAddAccount();

      await ctx.modularDrawer.selectAssetForAddAccount("BTC");
      await ctx.modularDrawer.confirmAddAccount();
      await ctx.portfolio.expectAsset("Bitcoin");
    },
  );
}
