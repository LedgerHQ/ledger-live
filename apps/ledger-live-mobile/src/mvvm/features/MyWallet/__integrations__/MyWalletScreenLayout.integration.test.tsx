import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { MyWalletScreen } from "..";

jest.mock("../views/MyLedgerSection", () => {
  const { createElement } = jest.requireActual<typeof import("react")>("react");
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return { MyLedgerSection: () => createElement(Text, null, "My Ledger section") };
});

const Stack = createNativeStackNavigator();

function renderMyWalletScreen(isDeviceListEnabled: boolean) {
  return render(
    <Stack.Navigator>
      <Stack.Screen name={ScreenName.MyWallet} component={MyWalletScreen} />
    </Stack.Navigator>,
    {
      overrideInitialState: withFlagOverrides({
        lwmMyWalletDeviceList: { enabled: isDeviceListEnabled },
      }),
    },
  );
}

describe("MyWalletScreen layout", () => {
  it("GIVEN the device list flag is on, WHEN My Wallet shows, THEN it should scroll everything below the header", () => {
    // GIVEN / WHEN
    renderMyWalletScreen(true);

    // THEN
    expect(screen.getByTestId("my-wallet-scroll")).toBeOnTheScreen();
    expect(screen.getByText("My Ledger section")).toBeVisible();
  });

  it("GIVEN the device list flag is off, WHEN My Wallet shows, THEN it should keep the layout without a screen scroll", () => {
    // GIVEN / WHEN
    renderMyWalletScreen(false);

    // THEN
    expect(screen.queryByTestId("my-wallet-scroll")).toBeNull();
    expect(screen.getByText("My Ledger section")).toBeVisible();
  });
});
