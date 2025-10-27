import { device } from "detox";
import { isAndroid, launchApp } from "../helpers/commonHelpers";

describe("Onboarding", () => {
  let isFirstTest = true;

  beforeEach(async () => {
    if (!isFirstTest) {
      await device.uninstallApp();
      await device.installApp();
      await launchApp();
    } else isFirstTest = false;
  });

  it("does the Onboarding and choose to access wallet", async () => {
    await app.onboarding.startOnboarding();
    await app.onboarding.chooseToAccessYourWallet();
    await app.onboarding.chooseToConnectYourLedger();
    await app.common.selectAddDevice();
    await app.common.addDeviceViaBluetooth();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.portfolio.expectPortfolioEmpty();
  });

  it("does the Onboarding and choose to restore a Nano X", async () => {
    await app.onboarding.startOnboarding();
    await app.onboarding.chooseSetupLedger();
    await app.onboarding.chooseDevice("nanoX");
    await app.onboarding.goesThroughRestorePhrase();
    await app.common.selectAddDevice();
    await app.common.addDeviceViaBluetooth();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.portfolio.expectPortfolioEmpty();
  });

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
      await app.common.addDeviceViaUSB("nanoSP");
      await app.portfolio.waitForPortfolioPageToLoad();
    }
  });

  it("does the Onboarding and choose to setup a new Nano X", async () => {
    await app.onboarding.startOnboarding();
    await app.onboarding.chooseSetupLedger();
    await app.onboarding.chooseDevice("nanoX");
    await app.onboarding.goesThroughCreateWallet();
    await app.common.selectAddDevice();
    await app.common.addDeviceViaBluetooth();
    await app.portfolio.waitForPortfolioPageToLoad();
  });
});
