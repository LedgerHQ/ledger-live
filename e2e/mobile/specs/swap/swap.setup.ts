import { swapSetup } from "../../bridge/server";
import { ApplicationOptions } from "page";
import { ABTestingVariants } from "@ledgerhq/types-live";

export async function beforeAllFunctionSwap(options: ApplicationOptions) {
  await app.init({
    userdata: options.userdata,
    speculosApp: options.speculosApp,
    featureFlags: {
      ptxSwapLiveAppMobile: {
        enabled: true,
        params: {
          manifest_id:
            process.env.PRODUCTION === "true" ? "swap-live-app-aws" : "swap-live-app-stg-aws",
        },
      },
      llmAnalyticsOptInPrompt: {
        enabled: true,
        params: {
          variant: ABTestingVariants.variantA,
          entryPoints: [],
        },
      },
    },
    cliCommandsOnApp: options.cliCommandsOnApp,
  });
  await app.portfolio.waitForPortfolioPageToLoad();
  await swapSetup();
  await app.swap.openViaDeeplink();
  await app.swapLiveApp.expectSwapLiveApp();
}
