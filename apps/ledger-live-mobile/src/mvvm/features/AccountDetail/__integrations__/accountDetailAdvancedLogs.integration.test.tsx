import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { parseAnyAccountId } from "@domain/entity-account";
import { copyToClipboard } from "@shared/clipboard";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import AccountScreen from "../AccountScreen";
import { ACCOUNT_DETAIL_TEST_IDS } from "../testIds";

jest.mock("@shared/clipboard", () => ({ copyToClipboard: jest.fn() }));

const mockCopyToClipboard = jest.mocked(copyToClipboard);

const btcAccount = genAccount("account-detail-advanced-logs-btc", {
  currency: getCryptoCurrencyById("bitcoin"),
});

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

function renderAccountDetail() {
  return render(
    <Stack.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={ScreenName.Account}
        component={AccountScreen}
        initialParams={{ accountId: btcAccount.id }}
      />
    </Stack.Navigator>,
    {
      overrideInitialState: (state: State): State => {
        const withFlag = withFlagOverrides({ accountDetail: { enabled: true } })(state);
        return {
          ...withFlag,
          accounts: { ...withFlag.accounts, active: [btcAccount] },
          wallet: {
            ...withFlag.wallet,
            accountNames: new Map([[parseAnyAccountId(btcAccount.id), "Bitcoin 1"]]),
          },
        };
      },
    },
  );
}

async function openAdvancedLogs() {
  const view = renderAccountDetail();
  await view.user.press(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.settingsButton));
  await view.user.press(screen.getByText("View advanced logs"));
  return view;
}

describe("AccountDetail advanced logs", () => {
  beforeEach(() => {
    mockCopyToClipboard.mockResolvedValue(true);
  });

  it("opens the advanced logs of the account from the settings sheet", async () => {
    await openAdvancedLogs();

    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.advancedLogsScreen)).toBeVisible();
    expect(screen.getAllByText("Advanced logs").at(-1)).toBeVisible();
    expect(screen.getByTestId("account-settings-advanced-logs-json")).toHaveTextContent(
      btcAccount.id,
      { exact: false },
    );
  });

  it("copies the logs and shows the copied feedback", async () => {
    const { user } = await openAdvancedLogs();

    await user.press(screen.getByText("Copy logs"));

    expect(mockCopyToClipboard).toHaveBeenCalledWith(expect.stringContaining(btcAccount.xpub!));
    expect(await screen.findByText("Copied")).toBeVisible();
  });

  it("goes back to the account detail", async () => {
    const { user } = await openAdvancedLogs();

    await user.press(screen.getByTestId("navigation-header-back-button"));

    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.screen)).toBeVisible();
    expect(screen.queryByTestId(ACCOUNT_DETAIL_TEST_IDS.advancedLogsScreen)).toBeNull();
  });
});
