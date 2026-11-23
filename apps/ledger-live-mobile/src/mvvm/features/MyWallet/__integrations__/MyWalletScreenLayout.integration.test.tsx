import React from "react";
import { StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { fireEvent, render, screen, withFlagOverrides } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { MyWalletScreen } from "..";

jest.mock("../views/MyLedgerSection", () => {
  const { createElement } = jest.requireActual<typeof import("react")>("react");
  const { Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    MyLedgerSection: ({
      onPairingStateChanged,
    }: {
      onPairingStateChanged?: (isPairing: boolean) => void;
    }) =>
      createElement(
        Pressable,
        { onPress: () => onPairingStateChanged?.(true) },
        createElement(Text, null, "My Ledger section"),
      ),
  };
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

  it("GIVEN the device list flag is on, WHEN the Add mode starts, THEN it should stop the screen scroll and bound its height", async () => {
    // GIVEN
    const { user } = renderMyWalletScreen(true);
    fireEvent(screen.getByTestId("my-wallet-scroll"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 700 } },
    });
    expect(screen.getByTestId("my-wallet-scroll")).toHaveProp("scrollEnabled", true);

    // WHEN
    await user.press(screen.getByText("My Ledger section"));

    // THEN
    const scroll = screen.getByTestId("my-wallet-scroll");
    expect(scroll).toHaveProp("scrollEnabled", false);
    expect(StyleSheet.flatten(scroll.props.contentContainerStyle)).toMatchObject({ height: 700 });
  });

  it("GIVEN the device list flag is off, WHEN My Wallet shows, THEN it should keep the layout without a screen scroll", () => {
    // GIVEN / WHEN
    renderMyWalletScreen(false);

    // THEN
    expect(screen.queryByTestId("my-wallet-scroll")).toBeNull();
    expect(screen.getByText("My Ledger section")).toBeVisible();
  });
});
