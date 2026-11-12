import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { render, screen } from "@tests/test-renderer";
import ReceiveConfirmation from "~/screens/ReceiveFunds/03-Confirmation";
import type { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { ScreenName } from "~/const";
import {
  XRP_ACCOUNT,
  XRP_ACCOUNT_WITH_TOKEN,
  XRP_REMOVED_TOKEN_ACCOUNT,
  overrideWithAccounts,
} from "../__mocks__/account.mock";
import { xrpIouToken } from "../__mocks__/currency.mock";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => {
  return {
    ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
    getXrpEnabledTokenStandards: jest.fn(),
  };
});

jest.mock("@react-navigation/native", () => {
  const navigation = jest.requireActual("@react-navigation/native");

  return {
    ...navigation,
    useNavigation: () => {
      return { ...navigation.useNavigation(), navigate: mockNavigate };
    },
  };
});

const mockNavigate = jest.fn();

const Stack = createNativeStackNavigator<ReceiveFundsStackParamList>();

const ALERT = "xrp-receive-add-token-alert";

function renderReceiveConfirmation(account = XRP_ACCOUNT, savedAccounts = [account]) {
  return render(
    <Stack.Navigator>
      <Stack.Screen
        name={ScreenName.ReceiveConfirmation}
        component={ReceiveConfirmation}
        initialParams={{
          account,
          accountId: account.id,
          parentId: account.id,
          currency: xrpIouToken,
          createTokenAccount: true,
        }}
      />
    </Stack.Navigator>,
    { overrideInitialState: overrideWithAccounts(...savedAccounts) },
  );
}

describe("XRP ReceiveConfirmation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue(["iou"]);
  });

  it("asks to add a token the account doesn't hold and opens its settings", async () => {
    const { user } = renderReceiveConfirmation();

    expect(await screen.findByTestId(ALERT)).toBeVisible();
    await user.press(screen.getByTestId("xrp-receive-add-token"));

    expect(mockNavigate).toHaveBeenCalledWith("XrpAddTokenFlow", {
      screen: ScreenName.XrpAddTokenSettings,
      params: { accountId: XRP_ACCOUNT.id, token: xrpIouToken },
    });
  });

  it("asks again for a removed token", async () => {
    renderReceiveConfirmation({ ...XRP_ACCOUNT, subAccounts: [XRP_REMOVED_TOKEN_ACCOUNT] });

    expect(await screen.findByTestId(ALERT)).toBeVisible();
  });

  it("shows no alert for a held token", async () => {
    renderReceiveConfirmation(XRP_ACCOUNT_WITH_TOKEN);

    expect(
      await screen.findByTestId(`receive-confirmation-title-${xrpIouToken.ticker}`),
    ).toBeVisible();
    expect(screen.queryByTestId(ALERT)).toBeNull();
  });

  it("shows no alert when the token standard is off", async () => {
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue([]);
    renderReceiveConfirmation();

    expect(
      await screen.findByTestId(`receive-confirmation-title-${xrpIouToken.ticker}`),
    ).toBeVisible();
    expect(screen.queryByTestId(ALERT)).toBeNull();
  });

  it("saves a new account without an empty token account", async () => {
    const { store } = renderReceiveConfirmation(XRP_ACCOUNT, []);

    await screen.findByTestId(ALERT);

    const savedAccounts = store.getState().accounts.active;
    expect(savedAccounts).toHaveLength(1);
    expect(savedAccounts[0].subAccounts).toEqual([]);
  });
});
