import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useShouldRedirect } from "./useShouldRedirect";
import { DeviceModelId } from "@ledgerhq/types-devices";

jest.mock("react-redux", () => ({
  useSelector: (fn: () => void) => fn(),
}));

jest.mock("@ledgerhq/live-common/featureFlags/index", () => ({
  useFeature: jest.fn(),
}));

jest.mock("~/reducers/settings", () => ({
  hasBeenUpsoldProtectSelector: jest.fn(),
  hasBeenRedirectedToPostOnboardingSelector: jest.fn(),
  lastConnectedDeviceSelector: jest.fn(),
}));

const { useFeature } = jest.requireMock("@ledgerhq/live-common/featureFlags/index");
const {
  hasBeenUpsoldProtectSelector,
  hasBeenRedirectedToPostOnboardingSelector,
  lastConnectedDeviceSelector,
} = jest.requireMock("~/reducers/settings");

function mockUseFeature(value: { enabled: boolean }) {
  useFeature.mockReturnValue(value);
}
function mockHasBeenUpsoldProtect(value: boolean) {
  hasBeenUpsoldProtectSelector.mockReturnValue(value);
}

function mockHasRedirectedToPostOnboarding(value: boolean) {
  hasBeenRedirectedToPostOnboardingSelector.mockReturnValue(value);
}

function mockLastConnectedDevice(value: Device) {
  lastConnectedDeviceSelector.mockReturnValue(value);
}

type Scenario = {
  device: { modelId: DeviceModelId };
  featureFlagEnabled: boolean;
  expected: { shouldRedirectToProtectUpsell: boolean; shouldRedirectToPostOnboarding: boolean };
};

function testScenarios(scenarios: Scenario[]) {
  it.each(scenarios)(
    "should return $expected for $device and feature flag enabled: $featureFlagEnabled",
    ({ device, featureFlagEnabled, expected }) => {
      mockLastConnectedDevice(device as Device);
      mockUseFeature({ enabled: featureFlagEnabled });

      const result = useShouldRedirect();

      expect(
        [result.shouldRedirectToPostOnboarding, result.shouldRedirectToProtectUpsell].filter(
          Boolean,
        ).length,
      ).toBeLessThanOrEqual(1);

      expect(result).toEqual(expected);
    },
  );
}

describe("useShouldRedirect", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("user HAS NOT BEEN UPSOLD protect & HAS NOT BEEN REDIRECTED to post onboarding", () => {
    beforeEach(() => {
      mockHasBeenUpsoldProtect(false);
      mockHasRedirectedToPostOnboarding(false);
    });

    testScenarios([
      {
        device: { modelId: DeviceModelId.nanoSP },
        featureFlagEnabled: false,
        expected: { shouldRedirectToProtectUpsell: false, shouldRedirectToPostOnboarding: true },
      },
      {
        device: { modelId: DeviceModelId.nanoSP },
        featureFlagEnabled: true,
        expected: { shouldRedirectToProtectUpsell: false, shouldRedirectToPostOnboarding: true },
      },
      {
        device: { modelId: DeviceModelId.nanoX },
        featureFlagEnabled: false,
        expected: { shouldRedirectToProtectUpsell: true, shouldRedirectToPostOnboarding: false },
      },
      {
        device: { modelId: DeviceModelId.nanoX },
        featureFlagEnabled: true,
        expected: { shouldRedirectToProtectUpsell: true, shouldRedirectToPostOnboarding: false },
      },
      {
        device: { modelId: DeviceModelId.stax },
        featureFlagEnabled: false,
        expected: { shouldRedirectToProtectUpsell: false, shouldRedirectToPostOnboarding: true },
      },
      {
        device: { modelId: DeviceModelId.stax },
        featureFlagEnabled: true,
        expected: { shouldRedirectToProtectUpsell: true, shouldRedirectToPostOnboarding: false },
      },
      {
        device: { modelId: DeviceModelId.europa },
        featureFlagEnabled: false,
        expected: { shouldRedirectToProtectUpsell: false, shouldRedirectToPostOnboarding: true },
      },
      {
        device: { modelId: DeviceModelId.europa },
        featureFlagEnabled: true,
        expected: { shouldRedirectToProtectUpsell: true, shouldRedirectToPostOnboarding: false },
      },
    ]);
  });

  describe("user HAS BEEN UPSOLD protect & HAS NOT BEEN REDIRECTED to post onboarding", () => {
    beforeEach(() => {
      mockHasBeenUpsoldProtect(true);
      mockHasRedirectedToPostOnboarding(false);
    });

    [
      DeviceModelId.nanoS,
      DeviceModelId.nanoSP,
      DeviceModelId.nanoX,
      DeviceModelId.stax,
      DeviceModelId.europa,
    ].forEach(modelId => {
      [true, false].forEach(featureFlagEnabled =>
        testScenarios([
          {
            device: { modelId },
            featureFlagEnabled,
            expected: {
              shouldRedirectToProtectUpsell: false,
              shouldRedirectToPostOnboarding: true,
            },
          },
        ]),
      );
    });
  });

  describe("user HAS BEEN UPSOLD PROTECT & HAS BEEN REDIRECTED to post onboarding", () => {
    beforeEach(() => {
      mockHasBeenUpsoldProtect(true);
      mockHasRedirectedToPostOnboarding(true);
    });
    [
      DeviceModelId.nanoS,
      DeviceModelId.nanoSP,
      DeviceModelId.nanoX,
      DeviceModelId.stax,
      DeviceModelId.europa,
    ].forEach(modelId => {
      [true, false].forEach(featureFlagEnabled =>
        testScenarios([
          {
            device: { modelId },
            featureFlagEnabled,
            expected: {
              shouldRedirectToProtectUpsell: false,
              shouldRedirectToPostOnboarding: false,
            },
          },
        ]),
      );
    });
  });

  describe("user HAS NOT BEEN UPSOLD protect & HAS BEEN REDIRECTED to post onboarding", () => {
    beforeEach(() => {
      mockHasBeenUpsoldProtect(false);
      mockHasRedirectedToPostOnboarding(true);
    });

    testScenarios([
      {
        device: { modelId: DeviceModelId.nanoSP },
        featureFlagEnabled: false,
        expected: { shouldRedirectToProtectUpsell: false, shouldRedirectToPostOnboarding: false },
      },
      {
        device: { modelId: DeviceModelId.nanoSP },
        featureFlagEnabled: true,
        expected: { shouldRedirectToProtectUpsell: false, shouldRedirectToPostOnboarding: false },
      },
      {
        device: { modelId: DeviceModelId.nanoX },
        featureFlagEnabled: false,
        expected: { shouldRedirectToProtectUpsell: true, shouldRedirectToPostOnboarding: false },
      },
      {
        device: { modelId: DeviceModelId.nanoX },
        featureFlagEnabled: true,
        expected: { shouldRedirectToProtectUpsell: true, shouldRedirectToPostOnboarding: false },
      },
      {
        device: { modelId: DeviceModelId.stax },
        featureFlagEnabled: false,
        expected: { shouldRedirectToProtectUpsell: false, shouldRedirectToPostOnboarding: false },
      },
      {
        device: { modelId: DeviceModelId.stax },
        featureFlagEnabled: true,
        expected: { shouldRedirectToProtectUpsell: true, shouldRedirectToPostOnboarding: false },
      },
      {
        device: { modelId: DeviceModelId.europa },
        featureFlagEnabled: false,
        expected: { shouldRedirectToProtectUpsell: false, shouldRedirectToPostOnboarding: false },
      },
      {
        device: { modelId: DeviceModelId.europa },
        featureFlagEnabled: true,
        expected: { shouldRedirectToProtectUpsell: true, shouldRedirectToPostOnboarding: false },
      },
    ]);
  });
});
