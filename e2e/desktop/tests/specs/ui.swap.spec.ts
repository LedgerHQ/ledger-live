import test from "tests/fixtures/common";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-common/e2e/speculos";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { setupEnv, performSwapUntilQuoteSelectionStep } from "tests/utils/swapUtils";
import { liveDataWithAddressCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";

const exchangeAppInfo: AppInfos = AppInfos.EXCHANGE;
const swapUiTags = [
  "@NanoSP",
  "@LNS",
  "@NanoX",
  "@Stax",
  "@Flex",
  "@NanoGen5",
  "@ethereum",
  "@family-evm",
  "@bitcoin",
  "@family-bitcoin",
];

const kycFromAccount = Account.BTC_NATIVE_SEGWIT_1;
const kycToAccount = Account.ETH_1;
const kycProvider = Provider.CHANGELLY;
const accPair: string[] = [kycFromAccount, kycToAccount].map(acc =>
  acc.currency.speculosApp.name.replaceAll(" ", "_"),
);

test.describe("Swap - Changelly KYC warning and feedback link", () => {
  setupEnv(true);
  test.beforeEach(async () => {
    setExchangeDependencies(
      accPair.map(appName => ({
        name: appName,
      })),
    );
  });
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: exchangeAppInfo,
    featureFlags: {
      ptxSwapLiveAppKycWarning: {
        enabled: true,
      },
      ptxSwapDetailedView: {
        enabled: false,
      },
    },
    cliCommandsOnApp: [
      [
        {
          app: kycFromAccount.currency.speculosApp,
          cmd: liveDataWithAddressCommand(kycFromAccount),
        },
        {
          app: kycToAccount.currency.speculosApp,
          cmd: liveDataWithAddressCommand(kycToAccount),
        },
      ],
      { scope: "test" },
    ],
  });
  test(
    "shows Changelly AML/KYC warning and displays feedback link from success drawer",
    {
      tag: swapUiTags,
      annotation: {
        type: "TMS",
        description: "B2CQA-3389, B2CQA-2370",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const minAmount = await app.swap.getMinimumAmount(kycFromAccount, kycToAccount);
      const initialSwap = new Swap(kycFromAccount, kycToAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(app, electronApp, initialSwap, minAmount);
      await app.swap.selectSpecificProvider(kycProvider, electronApp);
      const amountToSend = await app.swap.getAmountToSend(electronApp);
      const swap = new Swap(kycFromAccount, kycToAccount, amountToSend);

      await app.swap.clickExchangeButton(electronApp);
      await app.swapDrawer.checkKycWarningBannerVisible();
      await app.speculos.verifyAmountsAndAcceptSwap(swap, amountToSend);
      await app.swapDrawer.verifyExchangeCompletedTextContent(swap.accountToCredit.currency.name);
      await app.swapDrawer.checkShareYourFeedbackLinkVisible();
    },
  );
});
