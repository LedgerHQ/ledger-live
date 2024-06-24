import { device } from "detox";
import { isAndroid } from "../helpers";
import { Application } from "../page";

let app: Application;

const ethereumLong = "ethereum";
const bitcoinLong = "bitcoin";
const arbitrumLong = "arbitrum";
const bobaLong = "boba";

const mercuryoDL = { name: "Mercuryo", url: " https://www.mercuryo.io/" };
const discoverApps = [
  { name: "MoonPay", url: " https://www.moonpay.com/" }, // Opening only one App to avoid flakiness
  //{ name: "Ramp", url: " https://ramp.network/buy" },
  //{ name: "ParaSwap", url: " https://paraswap.io" },
  //{ name: "Lido", url: " https://lido.fi/" },
  //{ name: "1inch", url: " https://1inch.io/" },
  //{ name: "BTCDirect", url: " https://btcdirect.eu/" },
  //{ name: "Banxa", url: " https://banxa.com/" },
  //{ name: "Bitrefill", url: " https://bitrefill.com" },
  //{ name: "Zerion", url: " https://zerion.io/" },
  //{ name: "Rainbow", url: " https://rainbow.me" },
  //{ name: "POAP", url: " https://app.poap.xyz/" },
  //{ name: "Yearn", url: " https://beta.yearn.finance" },
  //{ name: "ChangeNOW", url: " https://changenow.io/" },
  //{ name: "Transak", url: " https://transak.com" },
];

const openNCheckApp = (l10n: { name: string; url: string }) => {
  it(`should open discovery to ${l10n.name}`, async () => {
    await app.discover.openViaDeeplink(l10n.name);
    await app.discover.expectUrl(l10n.url);
  });
};

$TmsLink("B2CQA-1837");
describe("DeepLinks Tests", () => {
  beforeAll(async () => {
    app = await Application.init("1AccountBTC1AccountETHReadOnlyFalse");
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  it("should open My Ledger page and add a device", async () => {
    await app.manager.openViaDeeplink();
    await app.manager.expectManagerPage();

    await app.onboarding.selectAddDevice();
    await app.manager.selectConnectDevice();
    await app.onboarding.addDeviceViaBluetooth();
    await app.manager.waitForDeviceInfoToLoad();
  });

  it("should open Account page", async () => {
    await app.account.openViaDeeplink();
    await app.accounts.waitForAccountsPageToLoad();
  });

  it("should open Add Account drawer", async () => {
    await app.addAccount.openViaDeeplink();
    await app.addAccount.selectCurrency("bitcoin");
  });

  it("should open ETH Account Asset page when given currency param", async () => {
    await app.account.openViaDeeplink(ethereumLong);
    await app.account.waitForAccountAssetsToLoad(ethereumLong);
  });

  it("should open BTC Account Asset page when given currency param", async () => {
    await app.account.openViaDeeplink(bitcoinLong);
    await app.account.waitForAccountAssetsToLoad(bitcoinLong);
  });

  it("should open Custom Lock Screen page", async () => {
    await app.customLockscreen.openViaDeeplink();
    await app.customLockscreen.expectCustomLockscreenPage();
  });

  it("should open the Discover page", async () => {
    await app.discover.openViaDeeplink();
    await app.discover.expectDiscoverPage();
  });

  // FIXME site unavailable on Android CI
  it.skip("should open a live app and be able to navigate to and from crypto select screen", async () => {
    if (!isAndroid()) return;
    await app.discover.openViaDeeplink(mercuryoDL.name);
    await app.discover.waitForSelectCrypto();
    await device.pressBack();
    await app.discover.expectUrl(mercuryoDL.url);
  });

  for (const l10n of discoverApps) {
    openNCheckApp(l10n);
  }

  it("should open Swap Form page", async () => {
    await app.swap.openViaDeeplink();
    await app.swap.expectSwapPage();
  });

  it("should open Send pages", async () => {
    await app.send.openViaDeeplink();
    await app.send.expectFirstStep();
    await app.portfolio.openViaDeeplink();
    await app.send.sendViaDeeplink(ethereumLong);
    await app.send.expectFirstStep();
    await app.common.expectSearch(ethereumLong);
  });

  it("should open Receive pages", async () => {
    await app.receive.openViaDeeplink();
    await app.receive.expectFirstStep();
    await app.portfolio.openViaDeeplink();
    await app.receive.receiveViaDeeplink(ethereumLong);
    await app.receive.expectSecondStep([ethereumLong, arbitrumLong, bobaLong]);
  });
});
