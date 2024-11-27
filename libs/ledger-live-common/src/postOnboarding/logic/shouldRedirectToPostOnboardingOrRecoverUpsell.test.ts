import { DeviceModelId } from "@ledgerhq/types-devices";
import { shouldRedirectToPostOnboardingOrRecoverUpsell } from "./shouldRedirectToPostOnboardingOrRecoverUpsell";

type Scenario = {
  device: { modelId: DeviceModelId };
  hasBeenUpsoldRecover: boolean;
  hasRedirectedToPostOnboarding: boolean;
  expected: { shouldRedirectToRecoverUpsell: boolean; shouldRedirectToPostOnboarding: boolean };
};

// This static array is enough to cover all cases as for each test case we have a scenario with Nano S (which is not in that array).
const mockedSupportedDeviceModels = [
  DeviceModelId.nanoSP,
  DeviceModelId.nanoX,
  DeviceModelId.stax,
  DeviceModelId.europa,
];

function testScenarios(scenarios: Scenario[]) {
  it.each(scenarios)(
    "should return $expected for $device and upsell for touch screen devices",
    ({ device, hasBeenUpsoldRecover, hasRedirectedToPostOnboarding, expected }) => {
      const result = shouldRedirectToPostOnboardingOrRecoverUpsell({
        lastConnectedDevice: device,
        hasBeenUpsoldRecover,
        hasRedirectedToPostOnboarding,
        supportedDeviceModels: mockedSupportedDeviceModels,
      });

      expect(
        [result.shouldRedirectToPostOnboarding, result.shouldRedirectToRecoverUpsell].filter(
          Boolean,
        ).length,
      ).toBeLessThanOrEqual(1);

      expect(result).toEqual(expected);
    },
  );
}

describe("useShouldRedirect", () => {
  describe("user HAS NOT BEEN UPSOLD recover & HAS NOT BEEN REDIRECTED to post onboarding", () => {
    const params = {
      hasBeenUpsoldRecover: false,
      hasRedirectedToPostOnboarding: false,
    };
    testScenarios(
      [
        {
          device: { modelId: DeviceModelId.nanoS },
          expected: { shouldRedirectToRecoverUpsell: false, shouldRedirectToPostOnboarding: true },
        },
        {
          device: { modelId: DeviceModelId.nanoS },
          expected: { shouldRedirectToRecoverUpsell: false, shouldRedirectToPostOnboarding: true },
        },
        {
          device: { modelId: DeviceModelId.nanoSP },
          expected: { shouldRedirectToRecoverUpsell: true, shouldRedirectToPostOnboarding: false },
        },
        {
          device: { modelId: DeviceModelId.nanoSP },
          expected: { shouldRedirectToRecoverUpsell: true, shouldRedirectToPostOnboarding: false },
        },
        {
          device: { modelId: DeviceModelId.nanoX },
          expected: { shouldRedirectToRecoverUpsell: true, shouldRedirectToPostOnboarding: false },
        },
        {
          device: { modelId: DeviceModelId.nanoX },
          expected: { shouldRedirectToRecoverUpsell: true, shouldRedirectToPostOnboarding: false },
        },
        {
          device: { modelId: DeviceModelId.stax },
          expected: { shouldRedirectToRecoverUpsell: true, shouldRedirectToPostOnboarding: false },
        },
        {
          device: { modelId: DeviceModelId.europa },
          expected: { shouldRedirectToRecoverUpsell: true, shouldRedirectToPostOnboarding: false },
        },
      ].map(scenario => ({ ...scenario, ...params })),
    );
  });

  describe("user HAS BEEN UPSOLD recover & HAS NOT BEEN REDIRECTED to post onboarding", () => {
    [
      DeviceModelId.nanoS,
      DeviceModelId.nanoSP,
      DeviceModelId.nanoX,
      DeviceModelId.stax,
      DeviceModelId.europa,
    ].forEach(modelId => {
      testScenarios([
        {
          device: { modelId },
          expected: {
            shouldRedirectToRecoverUpsell: false,
            shouldRedirectToPostOnboarding: true,
          },
          hasBeenUpsoldRecover: true,
          hasRedirectedToPostOnboarding: false,
        },
      ]);
    });
  });

  describe("user HAS BEEN UPSOLD PROTECT & HAS BEEN REDIRECTED to post onboarding", () => {
    [
      DeviceModelId.nanoS,
      DeviceModelId.nanoSP,
      DeviceModelId.nanoX,
      DeviceModelId.stax,
      DeviceModelId.europa,
    ].forEach(modelId => {
      testScenarios([
        {
          device: { modelId },
          expected: {
            shouldRedirectToRecoverUpsell: false,
            shouldRedirectToPostOnboarding: false,
          },
          hasBeenUpsoldRecover: true,
          hasRedirectedToPostOnboarding: true,
        },
      ]);
    });
  });

  describe("user HAS NOT BEEN UPSOLD recover & HAS BEEN REDIRECTED to post onboarding", () => {
    const params = {
      hasBeenUpsoldRecover: false,
      hasRedirectedToPostOnboarding: true,
    };
    testScenarios(
      [
        {
          device: { modelId: DeviceModelId.nanoS },
          expected: { shouldRedirectToRecoverUpsell: false, shouldRedirectToPostOnboarding: false },
        },
        {
          device: { modelId: DeviceModelId.nanoS },
          expected: { shouldRedirectToRecoverUpsell: false, shouldRedirectToPostOnboarding: false },
        },
        {
          device: { modelId: DeviceModelId.nanoSP },
          expected: { shouldRedirectToRecoverUpsell: true, shouldRedirectToPostOnboarding: false },
        },
        {
          device: { modelId: DeviceModelId.nanoSP },
          expected: { shouldRedirectToRecoverUpsell: true, shouldRedirectToPostOnboarding: false },
        },
        {
          device: { modelId: DeviceModelId.nanoX },
          expected: { shouldRedirectToRecoverUpsell: true, shouldRedirectToPostOnboarding: false },
        },
        {
          device: { modelId: DeviceModelId.nanoX },
          expected: { shouldRedirectToRecoverUpsell: true, shouldRedirectToPostOnboarding: false },
        },
        {
          device: { modelId: DeviceModelId.stax },
          expected: { shouldRedirectToRecoverUpsell: true, shouldRedirectToPostOnboarding: false },
        },
        {
          device: { modelId: DeviceModelId.europa },
          expected: { shouldRedirectToRecoverUpsell: true, shouldRedirectToPostOnboarding: false },
        },
      ].map(scenario => ({ ...scenario, ...params })),
    );
  });
});
