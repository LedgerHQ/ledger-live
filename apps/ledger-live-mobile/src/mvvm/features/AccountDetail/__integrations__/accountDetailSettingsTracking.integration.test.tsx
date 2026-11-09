import React from "react";
import { Pressable, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { parseAnyAccountId } from "@domain/entity-account";
import { track, trackPage } from "@shared/analytics";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BASE_NAVIGATOR_ID, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import AccountScreen from "../AccountScreen";
import { ACCOUNT_DETAIL_TEST_IDS } from "../testIds";

jest.mock("@shared/clipboard", () => ({ copyToClipboard: jest.fn().mockResolvedValue(true) }));

const btcAccount = genAccount("account-detail-settings-tracking-btc", {
  currency: getCryptoCurrencyById("bitcoin"),
  operationsSize: 1,
});

const COMMON = { network: "bitcoin" };
const SETTINGS = { ...COMMON, page: "Account Settings" };
const REMOVE = { ...COMMON, page: "Remove Account" };

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

function PreviousScreen({
  navigation,
}: StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PortfolioOperationHistory>) {
  return (
    <Pressable
      testID="open-account"
      onPress={() => navigation.navigate(ScreenName.Account, { accountId: btcAccount.id })}
    >
      <Text>Previous screen</Text>
    </Pressable>
  );
}

async function renderAndOpenSettings() {
  const view = render(
    <Stack.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ScreenName.PortfolioOperationHistory} component={PreviousScreen} />
      <Stack.Screen name={ScreenName.Account} component={AccountScreen} />
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
  await view.user.press(screen.getByTestId("open-account"));
  jest.mocked(track).mockClear();
  jest.mocked(trackPage).mockClear();
  await view.user.press(await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.settingsButton));
  return view;
}

const clicked = (props: Record<string, unknown>) => ["button_clicked", props];

describe("AccountDetail tracking: settings", () => {
  it("tracks the settings button, then Page Account Settings sourced from the account page", async () => {
    await renderAndOpenSettings();

    expect(track).toHaveBeenCalledWith(
      ...clicked({ ...COMMON, button: "account settings", page: "Account" }),
    );
    expect(trackPage).toHaveBeenCalledWith({
      category: "Account Settings",
      props: { ...COMMON, source: "Account" },
    });
  });

  it("tracks edit account name, then validate edit account name", async () => {
    const { user } = await renderAndOpenSettings();

    await user.press(screen.getByTestId("account-settings-change-name"));

    expect(track).toHaveBeenCalledWith(...clicked({ ...SETTINGS, button: "edit account name" }));

    await user.clear(screen.getByDisplayValue("Bitcoin 1"));
    await user.type(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.editNameInput), "Savings");
    await user.press(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.editNameSubmit));

    expect(track).toHaveBeenCalledWith(
      ...clicked({ ...SETTINGS, button: "validate edit account name" }),
    );
  });

  it("tracks view logs, then copy logs", async () => {
    const { user } = await renderAndOpenSettings();

    await user.press(screen.getByText("View advanced logs"));

    expect(track).toHaveBeenCalledWith(...clicked({ ...SETTINGS, button: "view logs" }));

    await user.press(screen.getByText("Copy logs"));

    expect(track).toHaveBeenCalledWith(...clicked({ ...SETTINGS, button: "copy logs" }));
  });

  it("tracks view in explorer", async () => {
    const { user } = await renderAndOpenSettings();

    await user.press(screen.getByText("View in explorer"));

    expect(track).toHaveBeenCalledWith(...clicked({ ...SETTINGS, button: "view in explorer" }));
  });

  it("tracks remove from portfolio on the settings, then its validation on Remove Account", async () => {
    const { user } = await renderAndOpenSettings();

    await user.press(screen.getByText("Remove account from portfolio"));

    expect(track).toHaveBeenCalledWith(
      ...clicked({ ...SETTINGS, button: "remove from portfolio" }),
    );

    await user.press(screen.getByText("Yes, remove."));

    expect(track).toHaveBeenCalledWith(
      ...clicked({ ...REMOVE, button: "validate remove from portfolio" }),
    );
  });

  it("tracks the cancellation of the removal on Remove Account", async () => {
    const { user } = await renderAndOpenSettings();
    await user.press(screen.getByText("Remove account from portfolio"));

    await user.press(screen.getByText("Keep"));

    expect(track).toHaveBeenCalledWith(
      ...clicked({ ...REMOVE, button: "cancel remove from portfolio" }),
    );
  });
});
