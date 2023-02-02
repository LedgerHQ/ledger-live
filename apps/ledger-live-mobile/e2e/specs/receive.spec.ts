import { waitFor } from "detox";
import PortfolioPage from "../models/wallet/portfolioPage";
import OnboardingSteps from "../models/onboarding/onboardingSteps";
import * as bridge from "../bridge/server";

import { loadConfig } from "../bridge/server";

let onboardingSteps: OnboardingSteps;
let portfolioPage: PortfolioPage;

describe("Receive BTC", () => {

  beforeAll(async () => {
    await loadConfig("1AccountBTC1AccountETH", true);
    portfolioPage = new PortfolioPage();
    onboardingSteps = new OnboardingSteps();
  });

  it("should tap main Button and add a Device", async () => {
    await portfolioPage.tapMainButton();
    await portfolioPage.tapSetupDeviceCta();
    await onboardingSteps.selectYourDevice("Ledger\u00A0Nano\u00A0X");
    await onboardingSteps.chooseToConnectYourNano();
    await onboardingSteps.verifyContentsOfBoxAreChecked();
    await onboardingSteps.chooseToPairMyNano();
    await onboardingSteps.selectPairWithBluetooth();

    onboardingSteps.bridgeAddDevices();
    await waitFor(onboardingSteps.getNanoDevice("David"))
      .toExist()
      .withTimeout(3000);
    await onboardingSteps.addDeviceViaBluetooth("David");
    
    await waitFor(onboardingSteps.getContinue()).toExist().withTimeout(3000);
    await onboardingSteps.openLedgerLive();
  });
  
  it("should start receive device action", async () => {
    await portfolioPage.tapMainButton();
    await portfolioPage.tapReceiveButton();
    await portfolioPage.tapBitcoinOption();
    await portfolioPage.tapBitcoinAccount();
    await portfolioPage.tapVerifyAddress();

    bridge.createMock();
    bridge.open();
    await new Promise((resolve) => setTimeout(() => resolve("a"), 100000))
  });

});
  