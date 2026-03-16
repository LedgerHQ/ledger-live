import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { OperationType } from "@ledgerhq/live-common/e2e/enum/OperationType";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { getParentAccountName } from "@ledgerhq/live-common/lib/e2e/enum/Account";
import { isWallet40 } from "../../helpers/commonHelpers";
import { beforeAllFunction, handleBuySellFlow, liveDataCommand } from "./buySell";

const btcBuySell = {
  crypto: Account.BTC_NATIVE_SEGWIT_1,
  fiat: { locale: "en-US", currencyTicker: "USD" },
  amount: "900",
  operation: OperationType.Buy,
};

const provider = Provider.MOONPAY;
const paymentMethod = "card";

const tags = [
  "@NanoSP",
  "@LNS",
  "@NanoX",
  "@Stax",
  "@Flex",
  "@NanoGen5",
  "@bitcoin",
  "@family-bitcoin",
];

describe("Navigate to Buy from portfolio and account pages - BTC", () => {
  beforeAll(async () => {
    await beforeAllFunction({
      userdata: "skip-onboarding",
      speculosApp: btcBuySell.crypto.currency.speculosApp,
      cliCommands: [
        liveDataCommand(btcBuySell.crypto.currency.speculosApp, btcBuySell.crypto.index),
      ],
      featureFlags: {
        llmAccountListUI: { enabled: true },
      },
    });
  });

  $TmsLink("B2CQA-3520");
  tags.forEach(tag => $Tag(tag));
  it("should navigate to Buy BTC from portfolio page", async () => {
    await app.portfolio.openViaDeeplink();
    if (isWallet40) {
      await app.portfolio.pressQuickActionBuyButton();
    } else {
      await app.transferMenuDrawer.open();
      await app.transferMenuDrawer.navigateToBuy();
    }
    await handleBuySellFlow(btcBuySell, paymentMethod, provider);
  });

  $TmsLink("B2CQA-3467");
  tags.forEach(tag => $Tag(tag));
  it("should navigate to Buy BTC from account page", async () => {
    await app.accounts.openViaDeeplink();
    await app.common.goToAccountByName(getParentAccountName(btcBuySell.crypto));
    if (btcBuySell.crypto.tokenType) {
      await app.account.navigateToTokenInAccount(btcBuySell.crypto);
    }
    await app.account.tapBuy();
    await handleBuySellFlow(btcBuySell, paymentMethod, provider);
  });
});
