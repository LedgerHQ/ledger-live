import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { track } from "@shared/analytics";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import { XRP_ACCOUNT, XRP_ACCOUNT_WITH_TOKEN } from "~/families/xrp/__mocks__/account.mock";
import AccountScreen from "../AccountScreen";
import { ACCOUNT_DETAIL_TEST_IDS } from "../testIds";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => {
  return {
    ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
    getXrpEnabledTokenStandards: jest.fn(),
  };
});

const getEnabledStandardsMock = jest.mocked(getXrpEnabledTokenStandards);

const btcAccount = genAccount("account-detail-manage-assets-btc", {
  currency: getCryptoCurrencyById("bitcoin"),
});

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

function ManageTokenFlowStub() {
  return <Text testID="xrp-manage-token-flow">Manage assets screen</Text>;
}

async function renderAndOpenSettings(account: Account, readOnlyModeEnabled = false) {
  const view = render(
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
  const settingsButton = await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.settingsButton);
  await view.user.press(settingsButton);

  return view;
}

describe("AccountDetail manage assets", () => {
  beforeEach(() => {
    getEnabledStandardsMock.mockReturnValue(["iou", "mpt"]);
  });

  it("opens Manage assets", async () => {
    const view = await renderAndOpenSettings(XRP_ACCOUNT_WITH_TOKEN);

    await view.user.press(screen.getByText("Manage assets"));

    expect(await screen.findByTestId("xrp-manage-token-flow")).toBeVisible();
  });

  it("tracks the Manage assets tap", async () => {
    const view = await renderAndOpenSettings(XRP_ACCOUNT_WITH_TOKEN);
    jest.mocked(track).mockClear();

    await view.user.press(screen.getByText("Manage assets"));

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("button_clicked", {
      network: XRP_ACCOUNT_WITH_TOKEN.currency.id,
      button: "manage assets",
      page: "Account Settings",
    });
  });

  it("hides Manage assets on an XRP account without tokens", async () => {
    await renderAndOpenSettings(XRP_ACCOUNT);

    expect(screen.getByText("View advanced logs")).toBeVisible();
    expect(screen.queryByText("Manage assets")).toBeNull();
  });

  it("hides Manage assets when no token standard is enabled", async () => {
    getEnabledStandardsMock.mockReturnValue([]);
    await renderAndOpenSettings(XRP_ACCOUNT_WITH_TOKEN);

    expect(screen.getByText("View advanced logs")).toBeVisible();
    expect(screen.queryByText("Manage assets")).toBeNull();
  });

  it("hides Manage assets in read-only mode", async () => {
    await renderAndOpenSettings(XRP_ACCOUNT_WITH_TOKEN, true);

    expect(screen.getByText("View advanced logs")).toBeVisible();
    expect(screen.queryByText("Manage assets")).toBeNull();
  });

  it("hides Manage assets on a non-XRP account", async () => {
    await renderAndOpenSettings(btcAccount);

    expect(screen.getByText("View advanced logs")).toBeVisible();
    expect(screen.queryByText("Manage assets")).toBeNull();
  });
});
