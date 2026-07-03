import pages from "../pages/pages.ts";
import { performInlineAddAccountFlow } from "../flows/earn.flows.ts";
import { waitEarnReady } from "../bridge/server.ts";

import { setEnv } from "@ledgerhq/live-env";
import type { PartialFeatures } from "@shared/feature-flags";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

import allureReporter from "@wdio/allure-reporter";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

const EARN_V2_FLAGS: PartialFeatures = {
  ptxEarnUi: { enabled: true, params: { value: "v2" } },
};

const FF_STAKE_PROGRAMS_MODAL: PartialFeatures = {
  stakePrograms: {
    enabled: true,
    params: {
      list: ["cosmos"],
      redirects: {
        ethereum: {
          platform: "earn",
          name: "Earn - Deposit",
          queryParams: {
            cryptoAssetId: "ethereum",
            intent: "deposit",
            ethDepositCohort: "basic_sorting",
          },
        },
      },
    },
  },
};

export const runInlineAddAccountTest = async (
  account: Account,
  tmsLinks: string[],
  tags: string[],
) => {
  for (const tmsLink of tmsLinks) {
    await allureReporter.addTestId(tmsLink);
  }
  for (const tag of tags) {
    await allureReporter.addTag(tag);
  }

  await pages.init({
    userdata: "skip-onboarding",
    speculosApp: account.currency.speculosApp,
    featureFlags:
      account.currency.ticker === "ETH"
        ? { ...EARN_V2_FLAGS, ...FF_STAKE_PROGRAMS_MODAL }
        : EARN_V2_FLAGS,
  });

  await pages.mainNavigation.waitForWallet40Ready();
  const earnReady = waitEarnReady();

  await pages.mainNavigation.tapWallet40Tab("earn");
  await earnReady;

  await performInlineAddAccountFlow(account);
};
