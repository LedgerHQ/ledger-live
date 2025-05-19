import { test } from "../fixtures/common";
import { addTmsLink } from "../utils/allureUtils";
import { getDescription } from "../utils/customJsonReporter";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { CLI } from "../utils/cliUtils";

const accounts = [
  { account: Account.BTC_NATIVE_SEGWIT_1, xrayTicket: "B2CQA-3391" },
  { account: Account.ETH_1, xrayTicket: "B2CQA-3392" },
  { account: Account.ETH_USDT_1, xrayTicket: "B2CQA-3393" },
];

for (const account of accounts) {
  test.describe("Buy / Sell", () => {
    test.use({
      userdata: "skip-onboarding",
      speculosApp: account.account.currency.speculosApp,
      cliCommands: [
        (appJsonPath: string) => {
          return CLI.liveData({
            currency: account.account.currency.speculosApp.name,
            index: account.account.index,
            add: true,
            appjson: appJsonPath,
          });
        },
      ],
    });

    test(
      `- Navigate to [${account.account.currency.name}] buy from asset page`,
      {
        annotation: {
          type: "TMS",
          description: account.xrayTicket,
        },
      },
      async ({ app, electronApp }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.layout.goToPortfolio();
        await app.portfolio.checkBuySellButtonVisibility();
        await app.portfolio.navigateToAsset(account.account.currency.name);
        await app.assetPage.startBuyFlow();
        await app.layout.verifyBuySellSideBarIsSelected();
        await app.buyAndSell.verifyBuySellScreen(electronApp);
      },
    );
  });
}
