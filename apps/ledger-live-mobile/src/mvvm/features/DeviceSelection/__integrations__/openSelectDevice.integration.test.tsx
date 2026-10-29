import React from "react";
import { BackHandler } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { act, render, screen, withFlagOverrides } from "@tests/test-renderer";
import { BaseOnboardingTestScreens } from "@tests/OnboardingTestScreens";
import { setReadOnlyMode } from "~/actions/settings";
import { NavigatorName } from "~/const";
import { AddAccountContexts } from "LLM/features/Accounts/screens/AddAccount/enums";
import RebornBuyDeviceDrawer from "LLM/features/Reborn/drawers/RebornBuyDeviceDrawer";
import DeviceSelectionNavigator from "../Navigator";
import { useOpenSelectDevice } from "../hooks/useOpenSelectDevice";

const Stack = createNativeStackNavigator();
const onCloseNavigation = jest.fn();

// Jest runs as iOS: call the back listeners like Android, newest first.
let backHandlers: (() => boolean | null | undefined)[] = [];
function pressAndroidBack() {
  act(() => {
    [...backHandlers].reverse().some(handler => handler());
  });
}

// Like the global modular drawer: rendered next to the screens, not inside one.
function GlobalAddAccount() {
  const openSelectDevice = useOpenSelectDevice();
  return (
    <>
      <Button
        testID="earn-add-account"
        onPress={() =>
          openSelectDevice({
            currency: getCryptoCurrencyById("ethereum"),
            context: AddAccountContexts.AddAccounts,
            onCloseNavigation,
          })
        }
      >
        Add account
      </Button>
      <RebornBuyDeviceDrawer />
    </>
  );
}

function Earn() {
  return <Text testID="earn-screen">Earn</Text>;
}

async function openAddAccount({ readOnly = true } = {}) {
  const view = render(
    <>
      <Stack.Navigator>
        <Stack.Screen name="Earn" component={Earn} />
        <Stack.Screen name={NavigatorName.DeviceSelection} component={DeviceSelectionNavigator} />
        <Stack.Screen name={NavigatorName.BaseOnboarding} component={BaseOnboardingTestScreens} />
      </Stack.Navigator>
      <GlobalAddAccount />
    </>,
    {
      overrideInitialState: withFlagOverrides({
        deviceOnboarding: { enabled: true, params: { unifiedEntryPoints: true } },
      }),
    },
  );
  if (!readOnly) {
    act(() => {
      view.store.dispatch(setReadOnlyMode(false));
    });
  }
  await view.user.press(screen.getByTestId("earn-add-account"));
  return view;
}

describe("Add account from a live app", () => {
  let addBackListener: jest.SpyInstance;

  beforeEach(() => {
    onCloseNavigation.mockClear();
    backHandlers = [];
    addBackListener = jest
      .spyOn(BackHandler, "addEventListener")
      .mockImplementation((_event, handler) => {
        backHandlers.push(handler);
        return { remove: () => (backHandlers = backHandlers.filter(h => h !== handler)) };
      });
  });

  afterEach(() => addBackListener.mockRestore());

  it("should ask for a device on the same screen in read-only mode", async () => {
    await openAddAccount();

    expect(await screen.findByTestId("reborn-buy-device-cta")).toBeVisible();
    expect(screen.getByTestId("earn-screen")).toBeVisible();
    expect(screen.queryByText(/Add a Ledger/i)).toBeNull();
    expect(onCloseNavigation).not.toHaveBeenCalled();
  });

  it("should cancel the add account when the user leaves the sheet", async () => {
    const { user } = await openAddAccount();

    await user.press(await screen.findByTestId("reborn-buy-device-buyCta"));

    expect(onCloseNavigation).toHaveBeenCalledTimes(1);
  });

  it("should go back to the caller and cancel when onboarding ends without a device", async () => {
    const { user } = await openAddAccount();

    await user.press(await screen.findByTestId("reborn-buy-device-cta"));
    expect(await screen.findByTestId("onboarding-setupLedger")).toBeVisible();
    expect(onCloseNavigation).not.toHaveBeenCalled();

    pressAndroidBack();

    expect(await screen.findByTestId("earn-screen")).toBeVisible();
    expect(screen.queryByText(/Add a Ledger/i)).toBeNull();
    expect(onCloseNavigation).toHaveBeenCalledTimes(1);
  });

  it("should show the device list when onboarding ends with a device", async () => {
    const { user, store } = await openAddAccount();

    await user.press(await screen.findByTestId("reborn-buy-device-cta"));
    expect(await screen.findByTestId("onboarding-setupLedger")).toBeVisible();

    act(() => {
      store.dispatch(setReadOnlyMode(false));
    });
    pressAndroidBack();

    expect(await screen.findByText(/Add a Ledger/i)).toBeVisible();
    expect(onCloseNavigation).not.toHaveBeenCalled();
  });

  it("should open the device list at once when a device is known", async () => {
    await openAddAccount({ readOnly: false });

    expect(await screen.findByText(/Add a Ledger/i)).toBeVisible();
    expect(onCloseNavigation).not.toHaveBeenCalled();
  });
});
