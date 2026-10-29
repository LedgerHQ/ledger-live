import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DeviceModelId } from "@ledgerhq/devices";
import { trackPage } from "@shared/analytics";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { BaseOnboardingTestScreens } from "@tests/OnboardingTestScreens";
import { NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import { MyLedgerSection } from "../views/MyLedgerSection";

const Stack = createNativeStackNavigator();

const knownDevice = { id: "stax-id", name: "Stax 4CE9", modelId: DeviceModelId.stax };

function renderSection({
  unifiedEntryPoints,
  withDevice,
}: {
  unifiedEntryPoints: boolean;
  withDevice: boolean;
}) {
  return render(
    <Stack.Navigator>
      <Stack.Screen name={ScreenName.MyWallet} component={MyLedgerSection} />
      <Stack.Screen name={NavigatorName.BaseOnboarding} component={BaseOnboardingTestScreens} />
    </Stack.Navigator>,
    {
      overrideInitialState: withFlagOverrides(
        { deviceOnboarding: { enabled: true, params: { unifiedEntryPoints } } },
        (state: State): State => ({
          ...state,
          ble: { ...state.ble, knownDevices: withDevice ? [knownDevice] : [] },
        }),
      ),
    },
  );
}

async function expectGetStartedFrom(source: string) {
  expect(await screen.findByTestId("onboarding-setupLedger")).toBeVisible();
  expect(screen.getByTestId("onboarding-accessWallet")).toBeVisible();
  expect(screen.queryByTestId("manager_setup_new_device")).toBeNull();
  expect(trackPage).toHaveBeenCalledWith(
    expect.objectContaining({ name: "Get Started", props: { source } }),
    expect.anything(),
  );
}

describe("MyLedgerSection add device", () => {
  afterEach(() => {
    jest.mocked(trackPage).mockClear();
  });

  it("should open the add device choice when unified entry points is off", async () => {
    const { user } = renderSection({ unifiedEntryPoints: false, withDevice: false });

    await user.press(screen.getByTestId("connect-with-bluetooth"));

    expect(await screen.findByTestId("manager_setup_new_device")).toBeVisible();
    expect(screen.queryByTestId("onboarding-setupLedger")).toBeNull();
  });

  it("should open Get Started from the empty device list", async () => {
    const { user } = renderSection({ unifiedEntryPoints: true, withDevice: false });

    await user.press(screen.getByTestId("connect-with-bluetooth"));

    await expectGetStartedFrom("my_wallet_empty");
  });

  it("should open Get Started when a device is already there", async () => {
    const { user } = renderSection({ unifiedEntryPoints: true, withDevice: true });

    await user.press(screen.getByText(/Add new|Add with Bluetooth/));

    await expectGetStartedFrom("my_wallet_add");
  });
});
