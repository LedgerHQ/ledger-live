import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import AccountScreen from "../AccountScreen";
import { ACCOUNT_DETAIL_TEST_IDS } from "../testIds";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => {
  return {
    ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
    getXrpEnabledTokenStandards: jest.fn(),
  };
});

const xrpAccount = genAccount("account-detail-manage-assets-xrp", {
  currency: getCryptoCurrencyById("ripple"),
});
const btcAccount = genAccount("account-detail-manage-assets-btc", {
  currency: getCryptoCurrencyById("bitcoin"),
});

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

function ManageTokenFlowStub() {
  return <Text testID="manage-token-flow-stub">Manage token flow</Text>;
}

function renderAccountDetail(account: Account, readOnlyModeEnabled = false) {
  return render(
    <Stack.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={ScreenName.Account}
        component={AccountScreen}
        initialParams={{ accountId: account.id }}
      />
      <Stack.Screen name={NavigatorName.XrpManageTokenFlow} component={ManageTokenFlowStub} />
    </Stack.Navigator>,
    {
      overrideInitialState: (state: State): State => {
        const withFlag = withFlagOverrides({ accountDetail: { enabled: true } })(state);
        return {
          ...withFlag,
          accounts: { ...withFlag.accounts, active: [account] },
          settings: { ...withFlag.settings, readOnlyModeEnabled },
        };
      },
    },
  );
}

describe("AccountDetail Manage assets", () => {
  beforeEach(() => {
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue(["iou", "mpt"]);
  });

  it("opens the XRP Manage assets flow from the settings sheet", async () => {
    const { user } = renderAccountDetail(xrpAccount);

    const settingsButton = await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.settingsButton);
    await user.press(settingsButton);
    await user.press(screen.getByTestId("account-settings-manage-assets"));

    const flowStub = await screen.findByTestId("manage-token-flow-stub");
    expect(flowStub).toBeVisible();
  });

  it("is hidden while no token standard is enabled", async () => {
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue([]);
    const { user } = renderAccountDetail(xrpAccount);

    const settingsButton = await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.settingsButton);
    await user.press(settingsButton);

    expect(screen.getByText("View advanced logs")).toBeVisible();
    expect(screen.queryByTestId("account-settings-manage-assets")).toBeNull();
  });

  it("is hidden in read-only mode", async () => {
    const { user } = renderAccountDetail(xrpAccount, true);

    const settingsButton = await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.settingsButton);
    await user.press(settingsButton);

    expect(screen.queryByTestId("account-settings-manage-assets")).toBeNull();
  });

  it("is hidden on a family without managed assets", async () => {
    const { user } = renderAccountDetail(btcAccount);

    const settingsButton = await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.settingsButton);
    await user.press(settingsButton);

    expect(screen.getByText("View advanced logs")).toBeVisible();
    expect(screen.queryByTestId("account-settings-manage-assets")).toBeNull();
  });
});
