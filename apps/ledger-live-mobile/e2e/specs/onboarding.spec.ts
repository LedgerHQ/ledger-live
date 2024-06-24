import { device } from "detox";
import { isAndroid } from "../helpers";
import { launchApp } from "../setup";
import { Application } from "../page";

let app: Application;

let isFirstTest = true;

describe("Onboarding", () => {
  beforeAll(() => {
    app = new Application();
  });

  beforeEach(async () => {
    if (!isFirstTest) {
      await device.uninstallApp();
      await device.installApp();
      await launchApp();
    } else isFirstTest = false;
  });

  $TmsLink("B2CQA-1803");
  it("does the Onboarding and choose to access wallet", async () => {
    await app.onboarding.startOnboarding();
    await app.onboarding.chooseToAccessYourWallet();
    await app.onboarding.chooseToConnectYourLedger();
    await app.onboarding.selectPairMyNano();
    await app.onboarding.selectAddDevice();
    await app.onboarding.addDeviceViaBluetooth();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.portfolio.expectPortfolioEmpty();
  });

  $TmsLink("B2CQA-1802");
  it("does the Onboarding and choose to restore a Nano X", async () => {
    await app.onboarding.startOnboarding();
    await app.onboarding.chooseSetupLedger();
    await app.onboarding.chooseDevice("nanoX");
    await app.onboarding.goesThroughRestorePhrase();
    await app.onboarding.selectPairMyNano();
    await app.onboarding.selectAddDevice();
    await app.onboarding.addDeviceViaBluetooth();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.portfolio.expectPortfolioEmpty();
  });

  $TmsLink("B2CQA-1800");
  $TmsLink("B2CQA-1833");
  it("does the Onboarding and choose to restore a Nano SP", async () => {
    await app.onboarding.startOnboarding();
    await app.onboarding.chooseSetupLedger();
    await app.onboarding.chooseDevice("nanoSP");
    if (!isAndroid()) {
      await app.onboarding.checkDeviceNotCompatible();
      await app.onboarding.chooseDevice("nanoS");
      await app.onboarding.checkDeviceNotCompatible();
    } else {
      await app.onboarding.goesThroughRestorePhrase();
      await app.onboarding.selectPairMyNano();
      await app.onboarding.addDeviceViaUSB("nanoSP");
      await app.portfolio.waitForPortfolioPageToLoad();
    }
  });

  $TmsLink("B2CQA-1799");
  it("does the Onboarding and choose to setup a new Nano X", async () => {
    await app.onboarding.startOnboarding();
    await app.onboarding.chooseSetupLedger();
    await app.onboarding.chooseDevice("nanoX");
    await app.onboarding.goesThroughCreateWallet();
    await app.onboarding.selectPairMyNano();
    await app.onboarding.selectAddDevice();
    await app.onboarding.addDeviceViaBluetooth();
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  $TmsLink("B2CQA-1804");
  it("does the Onboarding and choose to synchronize with Ledger Live Desktop", async () => {
    await device.launchApp({ permissions: { camera: "YES" } }); // Make sure permission is given
    await app.onboarding.startOnboarding();
    await app.onboarding.chooseToAccessYourWallet();
    await app.onboarding.chooseToSyncWithLedgerLiveDesktop();
    await app.onboarding.goesThroughLedgerLiveDesktopScanning();
    await app.onboarding.waitForScanningPage();
  });
});
