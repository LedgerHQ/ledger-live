import React from "react";
import { Pressable } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BASE_NAVIGATOR_ID, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import AccountScreen from "../AccountScreen";
import { ACCOUNT_DETAIL_TEST_IDS } from "../testIds";

jest.mock("~/screens/Account", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ route }: { route: { params?: { accountId?: string } } }) => (
      <Text testID="legacy-account-screen">{route.params?.accountId}</Text>
    ),
  };
});

jest.mock("@shared/analytics-react", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    ...jest.requireActual("@shared/analytics-react"),
    TrackScreen: ({ currency }: { currency?: string }) => (
      <Text testID="account-detail-tracked-currency">{currency}</Text>
    ),
  };
});

const btcAccount = genAccount("account-detail-btc", {
  currency: getCryptoCurrencyById("bitcoin"),
  operationsSize: 1,
});
const ethAccount = genAccount("account-detail-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 1,
  subAccountsCount: 0,
});
const usdcAccount = genTokenAccount(0, ethAccount, usdcToken);
const ethAccountWithToken: Account = { ...ethAccount, subAccounts: [usdcAccount] };

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

type AccountDetailFlag = { enabled: boolean; params?: { excludedCurrencyIds: string[] } };

type AccountScreenProps = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.Account>;

function AccountScreenWithAccountSwitch(props: AccountScreenProps) {
  return (
    <>
      <AccountScreen {...props} />
      <Pressable
        testID="switch-to-eth-account"
        onPress={() => props.navigation.setParams({ accountId: ethAccountWithToken.id })}
      />
    </>
  );
}

function renderAccountScreen(
  params: BaseNavigatorStackParamList[ScreenName.Account],
  accountDetail: AccountDetailFlag,
) {
  return render(
    <Stack.Navigator id={BASE_NAVIGATOR_ID}>
      <Stack.Screen
        name={ScreenName.Account}
        component={AccountScreenWithAccountSwitch}
        initialParams={params}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>,
    {
      overrideInitialState: (state: State): State => {
        const withFlag = withFlagOverrides({ accountDetail })(state);
        return {
          ...withFlag,
          accounts: { ...withFlag.accounts, active: [btcAccount, ethAccountWithToken] },
        };
      },
    },
  );
}

describe("AccountDetail entry", () => {
  it("opens the new screen when the flag is on", async () => {
    renderAccountScreen({ accountId: btcAccount.id }, { enabled: true });

    expect(await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.screen)).toBeVisible();
    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.hero)).toBeVisible();
    expect(screen.getByTestId("bottom-fade-gradient")).toBeOnTheScreen();
    expect(screen.queryByTestId("legacy-account-screen")).toBeNull();
  });

  it("keeps the legacy screen when the flag is off", () => {
    renderAccountScreen({ accountId: btcAccount.id }, { enabled: false });

    expect(screen.getByTestId("legacy-account-screen")).toBeVisible();
    expect(screen.queryByTestId(ACCOUNT_DETAIL_TEST_IDS.screen)).toBeNull();
  });

  it("keeps the legacy screen for an excluded currency only", () => {
    const accountDetail = { enabled: true, params: { excludedCurrencyIds: ["bitcoin"] } };

    renderAccountScreen({ accountId: btcAccount.id }, accountDetail);
    expect(screen.getByTestId("legacy-account-screen")).toBeVisible();
  });

  it("opens the new screen for a currency that is not excluded", () => {
    const accountDetail = { enabled: true, params: { excludedCurrencyIds: ["bitcoin"] } };

    renderAccountScreen({ accountId: ethAccountWithToken.id }, accountDetail);
    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.screen)).toBeVisible();
  });

  it("opens the parent account for a token sub-account when the flag is on", () => {
    renderAccountScreen(
      { accountId: usdcAccount.id, parentId: ethAccountWithToken.id },
      { enabled: true },
    );

    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.screen)).toBeVisible();
    expect(screen.queryByTestId("legacy-account-screen")).toBeNull();
  });

  it("keeps the token sub-account on the legacy screen when the flag is off", () => {
    renderAccountScreen(
      { accountId: usdcAccount.id, parentId: ethAccountWithToken.id },
      { enabled: false },
    );

    expect(screen.getByTestId("legacy-account-screen")).toHaveTextContent(usdcAccount.id);
  });

  it("follows the new account when the mounted entry screen receives another account", async () => {
    const { user } = renderAccountScreen({ accountId: btcAccount.id }, { enabled: true });
    expect(screen.getByTestId("account-detail-tracked-currency")).toHaveTextContent("Bitcoin");

    await user.press(screen.getByTestId("switch-to-eth-account"));

    expect(screen.getByTestId("account-detail-tracked-currency")).toHaveTextContent("Ethereum");
  });
});
