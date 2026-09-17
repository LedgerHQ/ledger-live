import { swapSetup } from "@e2e/bridge/server";
import { ApplicationOptions } from "@e2e/page/index";
import {
  DEFAULT_SWAP_FLAG_PRESET,
  type SwapFlagPreset,
} from "@ledgerhq/live-e2e-shared/data/swapLiveAppFlags";

type SwapSetupOptions = ApplicationOptions & {
  // The landing-page specs pick a variant; every other swap spec takes the default.
  flagPreset?: SwapFlagPreset;
};

export async function beforeAllFunctionSwap(options: SwapSetupOptions) {
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
    },
    cliCommandsOnApp: options.cliCommandsOnApp,
  });
  await app.mainNavigation.waitForWallet40Ready();
  await swapSetup();
  await app.swap.openViaDeeplink();
  await app.swapLiveApp.expectSwapLiveApp();
  // Pin before any test runs, so no spec asserts against a card variant Firebase chose
  // for it. The override outlives the spec file, but every swap spec file pins on entry,
  // so there is nothing left to clear afterwards.
  await app.swapLiveApp.applyFlagPreset(options.flagPreset ?? DEFAULT_SWAP_FLAG_PRESET);
}
