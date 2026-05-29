import React from "react";
import { Linking } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DeviceModelId } from "@ledgerhq/devices";
import i18next from "i18next";
import { render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import OnboardingStepUseCaseSelection from "../useCaseSelection";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: jest.fn(),
}));

jest.mock("LLM/components/QueuedDrawer/QueuedDrawerBottomSheet", () => {
  const { View, Pressable, Text } = require("react-native");
  return function MockQueuedDrawerBottomSheet({
    children,
    onClose,
    isRequestingToBeOpened,
    testID,
  }: {
    children: React.ReactNode;
    onClose?: () => void;
    isRequestingToBeOpened?: boolean;
    testID?: string;
  }) {
    if (!isRequestingToBeOpened) {
      return null;
    }
    return (
      <View testID={testID}>
        {children}
        <Pressable accessibilityLabel="Close" onPress={onClose}>
          <Text>Close</Text>
        </Pressable>
      </View>
    );
  };
});

// Lumen RN BottomSheet primitives need bottom-sheet context; stub the structural
// pieces and let the rest of the package render normally.
jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const RN = require("react-native");
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  return {
    ...actual,
    BottomSheetView: ({ children }: { children: React.ReactNode }) => <RN.View>{children}</RN.View>,
    BottomSheetHeader: () => <RN.View testID="bottom-sheet-header" />,
  };
});

const { useRoute } = jest.requireMock("@react-navigation/native");

const Stack = createNativeStackNavigator();
const HostScreenName = "OnboardingUseCaseHost";

function IntegrationNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name={HostScreenName} component={OnboardingStepUseCaseSelection} />
    </Stack.Navigator>
  );
}

const withCounterfeitFlag = (enabled: boolean) =>
  withFlagOverrides({
    lwmOnboardingCounterfeitWarning: { enabled },
  });

const withRecoverForNanoX = withFlagOverrides({
  lwmOnboardingCounterfeitWarning: { enabled: true },
  protectServicesMobile: {
    enabled: true,
    params: {
      compatibleDevices: [{ name: DeviceModelId.nanoX, available: true, comingSoon: false }],
      deeplink: "ledgerrecover://subscribe",
    },
  },
});

const renderUseCaseSelection = (
  deviceModelId: DeviceModelId,
  overrideInitialState = withCounterfeitFlag(false),
) => {
  useRoute.mockReturnValue({ params: { deviceModelId } });
  return render(<IntegrationNavigator />, { overrideInitialState });
};

const pressProceed = async (user: { press: (element: unknown) => Promise<void> }) => {
  await user.press(screen.getByText(i18next.t("onboarding.counterfeitWarning.cta.primary")));
};

describe("OnboardingStepUseCaseSelection counterfeit warning gate", () => {
  let openURLSpy: jest.SpiedFunction<typeof Linking.openURL>;

  beforeEach(() => {
    jest.clearAllMocks();
    openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    openURLSpy.mockRestore();
  });

  it("should navigate immediately when the flag is off on a legacy nano", async () => {
    const { user } = renderUseCaseSelection(DeviceModelId.nanoX, withCounterfeitFlag(false));

    await user.press(screen.getByTestId("onboarding-useCase-newWallet"));

    expect(screen.queryByTestId("counterfeit-warning-drawer")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.OnboardingModalSetupNewDevice, {
      deviceModelId: DeviceModelId.nanoX,
    });
  });

  it("should navigate immediately when the flag is on but the device is not legacy", async () => {
    const { user } = renderUseCaseSelection(DeviceModelId.stax, withCounterfeitFlag(true));

    await user.press(screen.getByTestId("onboarding-useCase-newWallet"));

    expect(screen.queryByTestId("counterfeit-warning-drawer")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.OnboardingModalSetupNewDevice, {
      deviceModelId: DeviceModelId.stax,
    });
  });

  it("should navigate immediately when the flag is off on a non-legacy device", async () => {
    const { user } = renderUseCaseSelection(DeviceModelId.stax, withCounterfeitFlag(false));

    await user.press(screen.getByTestId("onboarding-useCase-newWallet"));

    expect(screen.queryByTestId("counterfeit-warning-drawer")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.OnboardingModalSetupNewDevice, {
      deviceModelId: DeviceModelId.stax,
    });
  });

  it("should open the drawer and resume the new wallet flow after proceeding on legacy nano", async () => {
    const { user } = renderUseCaseSelection(DeviceModelId.nanoX, withCounterfeitFlag(true));

    await user.press(screen.getByTestId("onboarding-useCase-newWallet"));

    await waitFor(() => {
      expect(screen.getByTestId("counterfeit-warning-drawer")).toBeOnTheScreen();
    });
    expect(mockNavigate).not.toHaveBeenCalled();

    await pressProceed(user);

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.OnboardingModalSetupNewDevice, {
      deviceModelId: DeviceModelId.nanoX,
    });
  });

  it("should resume the recovery phrase flow when proceeding from restore", async () => {
    const { user } = renderUseCaseSelection(DeviceModelId.nanoX, withCounterfeitFlag(true));

    await user.press(screen.getByTestId("onboarding-useCase-recoveryPhrase"));

    await waitFor(() => {
      expect(screen.getByTestId("counterfeit-warning-drawer")).toBeOnTheScreen();
    });

    await pressProceed(user);

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.OnboardingRecoveryPhrase, {
      deviceModelId: DeviceModelId.nanoX,
      showSeedWarning: true,
    });
  });

  it("should resume the protect deeplink when proceeding from the recover card", async () => {
    const { user } = renderUseCaseSelection(DeviceModelId.nanoX, withRecoverForNanoX);

    await user.press(screen.getByTestId("Onboarding UseCase - Selection|Ledger Recover"));

    await waitFor(() => {
      expect(screen.getByTestId("counterfeit-warning-drawer")).toBeOnTheScreen();
    });

    await pressProceed(user);

    expect(openURLSpy).toHaveBeenCalledWith("ledgerrecover://subscribe");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should close the drawer on dismiss without navigation", async () => {
    const { user } = renderUseCaseSelection(DeviceModelId.nanoX, withCounterfeitFlag(true));

    await user.press(screen.getByTestId("onboarding-useCase-newWallet"));

    await waitFor(() => {
      expect(screen.getByTestId("counterfeit-warning-drawer")).toBeOnTheScreen();
    });

    await user.press(screen.getByLabelText("Close"));

    await waitFor(() => {
      expect(screen.queryByTestId("counterfeit-warning-drawer")).toBeNull();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
