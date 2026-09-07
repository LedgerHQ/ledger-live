import React, { useEffect } from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { Contact } from "@domain/entity-contact";
import {
  mockContact,
  mockContactWithAddress,
  mockContactWithMultipleAddresses,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { renderWithReactQuery, screen, withFlagOverrides, within } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { ModularDrawerWrapper } from "LLM/features/ModularDrawer";
import SendWorkflow from "LLM/features/Send";

const ethAccount = genAccount("contacts-first-eth", {
  currency: getCryptoCurrencyById("ethereum"),
});

type TestStackParamList = {
  PayHost: undefined;
  [NavigatorName.SendFlow]:
    | {
        params?: {
          selectContactBeforeAccount?: boolean;
          account?: { id: string };
          recipient?: string;
          skipRecipientStep?: boolean;
        };
      }
    | undefined;
  [NavigatorName.SendFunds]:
    | {
        screen: typeof ScreenName.SendCoin;
        params?: { currencyIds?: string[] };
      }
    | undefined;
  [NavigatorName.MyWallet]:
    | {
        screen: typeof ScreenName.MyWalletContactDetail;
        params: { contactId: string };
      }
    | undefined;
};

const Stack = createNativeStackNavigator<TestStackParamList>();

function SendFundsScreen({
  route,
}: NativeStackScreenProps<TestStackParamList, typeof NavigatorName.SendFunds>) {
  return (
    <Text testID="send-funds-screen">
      {route.params?.screen}:{route.params?.params?.currencyIds?.join(",") ?? ""}
    </Text>
  );
}

function MyWalletScreen({
  route,
}: NativeStackScreenProps<TestStackParamList, typeof NavigatorName.MyWallet>) {
  return (
    <Text testID="my-wallet-contact-detail-screen">
      {route.params?.screen}:{route.params?.params?.contactId ?? ""}
    </Text>
  );
}

function PayHostScreen({ navigation }: NativeStackScreenProps<TestStackParamList, "PayHost">) {
  useEffect(() => {
    navigation.navigate(NavigatorName.SendFlow, {
      params: { selectContactBeforeAccount: true },
    });
  }, [navigation]);

  return <Text>Pay home</Text>;
}

function renderContactsFirstSend(contacts: readonly Contact[]) {
  return renderWithReactQuery(
    <>
      <Stack.Navigator
        initialRouteName="PayHost"
        screenOptions={{ headerShown: false, animation: "none" }}
      >
        <Stack.Screen name="PayHost" component={PayHostScreen} />
        <Stack.Screen name={NavigatorName.SendFlow} component={SendWorkflow} />
        <Stack.Screen name={NavigatorName.SendFunds} component={SendFundsScreen} />
        <Stack.Screen name={NavigatorName.MyWallet} component={MyWalletScreen} />
      </Stack.Navigator>
      <ModularDrawerWrapper />
    </>,
    {
      overrideInitialState: withFlagOverrides(
        {
          llmModularDrawer: {
            enabled: true,
            params: { enableModularization: true, searchDebounceTime: 0 },
          },
          newSendFlow: {
            enabled: true,
            params: { families: ["evm"], excludedCurrencyIds: [] },
          },
          lwmContacts: { enabled: true, params: { newBadge: false } },
        },
        state => ({
          ...state,
          contacts: { contacts: [...contacts] },
          accounts: { active: [{ ...ethAccount, subAccounts: [] }] },
        }),
      ),
    },
  );
}

describe("Send contacts-first", () => {
  it("should open the address sheet then MAD for any saved address count", async () => {
    const oneAddress = mockContactWithAddress({ id: "contact-yana", name: "Yana" });
    const several = mockContactWithMultipleAddresses({
      id: "contact-stephanie",
      name: "Stephanie",
    });
    const { user, store } = renderContactsFirstSend([
      mockMeContact({ name: "Me" }),
      oneAddress,
      several,
    ]);

    expect(await screen.findByText("Contacts")).toBeVisible();
    expect(screen.getByText("Yana")).toBeVisible();
    expect(screen.getByText("Stephanie")).toBeVisible();
    expect(screen.queryByText("Me")).not.toBeOnTheScreen();

    await user.press(screen.getByText("Yana"));

    expect(await screen.findByText("Select Yana's address")).toBeVisible();
    await user.press(
      screen.getByLabelText(`${oneAddress.addresses[0].label}, ${oneAddress.addresses[0].address}`),
    );

    expect(store.getState().modularDrawer).toMatchObject({
      isOpen: true,
      flow: "send",
      source: "Pay",
      preselectedCurrencies: [oneAddress.addresses[0].currencyId],
    });
    expect(
      screen.queryByText(`${ScreenName.SendCoin}:${oneAddress.addresses[0].currencyId}`),
    ).not.toBeOnTheScreen();
    expect(screen.getByText("Yana")).toBeVisible();
    expect(screen.queryByText("Pay home")).not.toBeOnTheScreen();
  });

  it("should pick one address when the contact has several", async () => {
    const contact = mockContactWithMultipleAddresses({
      id: "contact-stephanie",
      name: "Stephanie",
    });
    const address = contact.addresses[1];
    const { user, store } = renderContactsFirstSend([contact]);

    await user.press(await screen.findByText("Stephanie"));

    expect(await screen.findByText("Select Stephanie's address")).toBeVisible();
    await user.press(screen.getByLabelText(`${address.label}, ${address.address}`));

    expect(store.getState().modularDrawer).toMatchObject({
      isOpen: true,
      flow: "send",
      preselectedCurrencies: [address.currencyId],
    });
    expect(
      screen.queryByText(`${ScreenName.SendCoin}:${address.currencyId}`),
    ).not.toBeOnTheScreen();
  });

  it("should show contacts that have no address", async () => {
    const withAddress = mockContactWithAddress({ id: "contact-yana", name: "Yana" });
    const withoutAddress = mockContact({ id: "contact-rosa", name: "Rosa" });
    renderContactsFirstSend([withAddress, withoutAddress]);

    expect(await screen.findByText("Yana")).toBeVisible();
    expect(screen.getByText("Rosa")).toBeVisible();
  });

  it("should hide Me when only Me is saved", async () => {
    renderContactsFirstSend([mockMeContact({ name: "Me" })]);

    expect(await screen.findByTestId("send-recipient-contacts-list")).toBeVisible();
    expect(screen.queryByText("Me")).not.toBeOnTheScreen();
  });

  it("should open send for the selected account", async () => {
    const yana = mockContactWithAddress({ id: "contact-yana", name: "Yana" });
    const address = yana.addresses[0];
    const { user } = renderContactsFirstSend([yana]);

    await user.press(await screen.findByText("Yana"));
    await user.press(await screen.findByLabelText(`${address.label}, ${address.address}`));
    await user.press(await screen.findByTestId("asset-item-ETH"));
    await user.press(await screen.findByTestId("account-item"));

    expect(await screen.findByTestId("recipient-contact-row")).toBeVisible();
    expect(within(screen.getByTestId("recipient-contact-row")).getByText("Yana")).toBeVisible();
    expect(screen.getByTestId("disabled-amount-continue-button")).toBeVisible();
  });
});
