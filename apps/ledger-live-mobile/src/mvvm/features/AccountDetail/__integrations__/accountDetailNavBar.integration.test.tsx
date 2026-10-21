import React from "react";
import { Pressable, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { parseAnyAccountId } from "@domain/entity-account";
import { render, screen, within, withFlagOverrides } from "@tests/test-renderer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BASE_NAVIGATOR_ID, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import AccountScreen from "../AccountScreen";
import { ACCOUNT_DETAIL_TEST_IDS } from "../testIds";

const ethAccount = {
  ...genAccount("account-detail-nav-bar-eth", {
    currency: getCryptoCurrencyById("ethereum"),
    subAccountsCount: 0,
  }),
  freshAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
};

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

function PreviousScreen({
  navigation,
}: StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PortfolioOperationHistory>) {
  return (
    <Pressable
      testID="open-account"
      onPress={() => navigation.navigate(ScreenName.Account, { accountId: ethAccount.id })}
    >
      <Text>Previous screen</Text>
    </Pressable>
  );
}

function renderFromPreviousScreen() {
  return render(
    <Stack.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ScreenName.PortfolioOperationHistory} component={PreviousScreen} />
      <Stack.Screen name={ScreenName.Account} component={AccountScreen} />
    </Stack.Navigator>,
    {
      overrideInitialState: (state: State): State => {
        const withFlag = withFlagOverrides({ accountDetail: { enabled: true } })(state);
        return {
          ...withFlag,
          accounts: { ...withFlag.accounts, active: [ethAccount] },
          wallet: {
            ...withFlag.wallet,
            accountNames: new Map([[parseAnyAccountId(ethAccount.id), "Ethereum 1"]]),
          },
        };
      },
    },
  );
}

describe("AccountDetail nav bar", () => {
  it("shows the account name, the shortened address and the network", async () => {
    const { user } = renderFromPreviousScreen();
    await user.press(screen.getByTestId("open-account"));

    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.navBarTitle)).toHaveTextContent("Ethereum 1");
    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.navBarAddress)).toHaveTextContent(
      "0x71...976F",
    );
    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.navBarNetworkIcon)).toBeVisible();
    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.settingsButton)).toBeVisible();
  });

  it("goes back to the previous screen", async () => {
    const { user } = renderFromPreviousScreen();
    await user.press(screen.getByTestId("open-account"));
    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.screen)).toBeVisible();

    await user.press(screen.getByTestId("navigation-header-back-button"));

    expect(screen.getByText("Previous screen")).toBeVisible();
    expect(screen.queryByTestId(ACCOUNT_DETAIL_TEST_IDS.screen)).toBeNull();
  });

  it("opens the account settings from the settings button", async () => {
    const present = jest.spyOn(BottomSheetModal.prototype, "present");
    try {
      const { user } = renderFromPreviousScreen();
      await user.press(screen.getByTestId("open-account"));
      expect(present).not.toHaveBeenCalled();

      await user.press(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.settingsButton));

      expect(present).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("account-settings-menu")).toBeVisible();
      expect(
        within(screen.getByTestId("account-settings-change-name")).getByText("Ethereum 1"),
      ).toBeVisible();
      expect(screen.getByText("Remove account from portfolio")).toBeVisible();
    } finally {
      present.mockRestore();
    }
  });
});
