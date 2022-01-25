// @flow
import * as bridge from "../bridge/server";
import { $tap, $proceed, $, $scrollTill, $waitFor } from "../utils";

export function onboard(modelId: DeviceModelId, usecase: Usecase) {
  getStarted();
  acceptTerms();
  selectUsecase(modelId, usecase);
}

function getStarted() {
  it("should go terms screen", async () => {
    await $proceed();
  });
}

function acceptTerms() {
  it("should check terms and policy", async () => {
    await $tap("TermsAcceptSwitch");
  });

  it("should enter Ledger App", async () => {
    await $proceed();
  });
}

async function selectUsecase(modelId: DeviceModelId, usecase: Usecase) {
  it(`should go connect screen for ${modelId}`, async () => {
    await $tap(`Onboarding Device - Selection|${modelId}`);
  });

  switch (usecase) {
    case "connect":
      if (modelId === "nanoX") {
        await connectViaBluetooth(modelId);
      }
      break;
    default:
      break;
  }
}

async function connectViaBluetooth(modelId: DeviceModelId) {
  it("should pair Nano via Bluetooth", async () => {
    const el = $(`Onboarding - Connect|${modelId}`);
    await $scrollTill(el);
    await $tap(el);
    await $waitFor("Onboarding - Seed warning");
    const dismissSeedWarning = $("Onboarding - Seed warning");
    await $tap(dismissSeedWarning);
    await $tap("OnboardingStemPairNewContinue");
    await $proceed();
    const [david] = bridge.addDevices();
    // TODO E2E: Android
    await $waitFor(`DeviceItemEnter ${david}`);
    await $tap(`DeviceItemEnter ${david}`);
    bridge.setInstalledApps();
    bridge.open();
    await $proceed();
    await $tap("OnboardingFinish");
  });
}

type DeviceModelId = "nanoS" | "nanoX" | "blue";

type Usecase = "newDevice" | "import" | "restore" | "connect";
