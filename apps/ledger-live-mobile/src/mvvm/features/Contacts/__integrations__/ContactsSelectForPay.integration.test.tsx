import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { QueuedBottomSheetProps } from "@shared/ui-queued-bottom-sheet";
import {
  mockContact,
  mockContactWithAddress,
  mockContactWithMultipleAddresses,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import type { MyWalletNavigatorStackParamList } from "LLM/features/MyWallet/types";
import { ContactsScreen } from "LLM/features/Contacts";
import { useContactsLedgerSyncStatus } from "LLM/features/Contacts/hooks/useContactsLedgerSyncStatus";

jest.mock("LLM/features/Contacts/hooks/useContactsLedgerSyncStatus");
jest.mock("@shared/ui-queued-bottom-sheet", () => {
  const actual = jest.requireActual("@shared/ui-queued-bottom-sheet");
  const React = jest.requireActual<typeof import("react")>("react");
  const { QueuedBottomSheet } = actual;

  function MockQueuedBottomSheet({
    isRequestingToBeOpened,
    isForcingToBeOpened,
    onOpened,
    ...props
  }: QueuedBottomSheetProps) {
    const shouldOpen = !!(isRequestingToBeOpened || isForcingToBeOpened);
    React.useEffect(() => {
      if (shouldOpen) {
        onOpened?.();
      }
    }, [onOpened, shouldOpen]);
    return (
      <QueuedBottomSheet
        isRequestingToBeOpened={isRequestingToBeOpened}
        isForcingToBeOpened={isForcingToBeOpened}
        onOpened={onOpened}
        {...props}
      />
    );
  }

  return {
    ...actual,
    QueuedBottomSheet: MockQueuedBottomSheet,
  };
});

const mockedContactsLedgerSyncStatus = jest.mocked(useContactsLedgerSyncStatus);

type TestStackParamList = {
  [ScreenName.MyWalletContacts]: MyWalletNavigatorStackParamList[typeof ScreenName.MyWalletContacts];
  [ScreenName.MyWalletContactDetail]: { contactId: string };
  [NavigatorName.MyWallet]:
    | {
        screen: typeof ScreenName.MyWalletContactDetail;
        params: { contactId: string };
      }
    | undefined;
  [NavigatorName.SendFunds]:
    | {
        screen: typeof ScreenName.SendCoin;
        params?: { currencyIds?: string[]; extra?: { recipient?: string } };
      }
    | undefined;
};

const Stack = createNativeStackNavigator<TestStackParamList>();

function ContactDetailScreen({
  route,
}: NativeStackScreenProps<TestStackParamList, typeof ScreenName.MyWalletContactDetail>) {
  return (
    <Text testID="my-wallet-contact-detail-screen">
      {ScreenName.MyWalletContactDetail}:{route.params.contactId}
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

function SendFundsScreen({
  route,
}: NativeStackScreenProps<TestStackParamList, typeof NavigatorName.SendFunds>) {
  return (
    <Text testID="send-funds-screen">
      {route.params?.screen}:{route.params?.params?.currencyIds?.join(",") ?? ""}
    </Text>
  );
}

function renderContactsSelectForPay({
  selectContactToPay = true,
  title = "Pay contact",
  hasDismissedContactsFeatureIntroduction = true,
  includeSavedContacts = true,
}: {
  selectContactToPay?: boolean;
  title?: string;
  hasDismissedContactsFeatureIntroduction?: boolean;
  includeSavedContacts?: boolean;
} = {}) {
  const me = mockMeContact();
  const yana = mockContactWithAddress({ id: "contact-yana", name: "Yana" });
  const stephanie = mockContactWithMultipleAddresses({
    id: "contact-stephanie",
    name: "Stephanie",
  });
  const rosa = mockContact({ id: "contact-rosa", name: "Rosa" });

  const result = render(
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
      <Stack.Screen
        name={ScreenName.MyWalletContacts}
        component={ContactsScreen}
        initialParams={selectContactToPay ? { title, selectContactToPay } : { title }}
      />
      <Stack.Screen name={ScreenName.MyWalletContactDetail} component={ContactDetailScreen} />
      <Stack.Screen name={NavigatorName.MyWallet} component={MyWalletScreen} />
      <Stack.Screen name={NavigatorName.SendFunds} component={SendFundsScreen} />
    </Stack.Navigator>,
    {
      overrideInitialState: withFlagOverrides(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({
          ...state,
          settings: {
            ...state.settings,
            hasDismissedContactsFeatureIntroduction,
          },
          contacts: {
            contacts: includeSavedContacts ? [me, yana, stephanie, rosa] : [me],
          },
        }),
      ),
    },
  );

  return { ...result, me, yana, stephanie, rosa };
}

describe("Contacts selectContactToPay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedContactsLedgerSyncStatus.mockReturnValue("ready");
  });

  it("should open the address sheet then MAD when a Pay contact is tapped", async () => {
    const { user, store, yana } = renderContactsSelectForPay();
    const address = yana.addresses[0];

    expect(await screen.findByTestId("contacts-screen")).toBeVisible();
    await user.press(await screen.findByTestId(`contacts-saved-contact-${yana.id}`));

    expect(await screen.findByText("Select Yana's address")).toBeVisible();
    await user.press(screen.getByLabelText(`${address.label}, ${address.address}`));

    expect(store.getState().modularDrawer).toMatchObject({
      isOpen: true,
      flow: "send",
      source: "Pay",
      preselectedCurrencies: [address.currencyId],
    });
    expect(
      screen.queryByText(`${ScreenName.SendCoin}:${address.currencyId}`),
    ).not.toBeOnTheScreen();
  });

  it("should still open the address sheet when the Pay contact has several addresses", async () => {
    const { user, store, stephanie } = renderContactsSelectForPay();
    const address = stephanie.addresses[1];

    await user.press(await screen.findByTestId(`contacts-saved-contact-${stephanie.id}`));

    expect(await screen.findByText("Select Stephanie's address")).toBeVisible();
    await user.press(screen.getByLabelText(`${address.label}, ${address.address}`));

    expect(store.getState().modularDrawer).toMatchObject({
      isOpen: true,
      flow: "send",
      source: "Pay",
      preselectedCurrencies: [address.currencyId],
    });
    expect(
      screen.queryByText(`${ScreenName.SendCoin}:${address.currencyId}`),
    ).not.toBeOnTheScreen();
  });

  it("should open the contact to add an address when the Pay picker has none", async () => {
    const { user, rosa } = renderContactsSelectForPay();

    await user.press(await screen.findByTestId(`contacts-saved-contact-${rosa.id}`));

    expect(await screen.findByText("Select Rosa's address")).toBeVisible();
    await user.press(screen.getByText("Add address"));

    expect(await screen.findByText(`${ScreenName.MyWalletContactDetail}:${rosa.id}`)).toBeVisible();
  });

  it("should still open Me from the Pay contact list", async () => {
    const { user, me } = renderContactsSelectForPay();

    await user.press(await screen.findByTestId("contacts-me-item"));

    expect(await screen.findByText(`${ScreenName.MyWalletContactDetail}:${me.id}`)).toBeVisible();
    expect(screen.queryByText(/Select .*'s address/)).not.toBeOnTheScreen();
  });

  it("should open Ledger Sync when adding a contact from Pay before the intro was dismissed", async () => {
    mockedContactsLedgerSyncStatus.mockReturnValue("inactive");
    const { user } = renderContactsSelectForPay({
      hasDismissedContactsFeatureIntroduction: false,
      includeSavedContacts: false,
    });

    expect(await screen.findByTestId("contacts-screen")).toBeVisible();
    expect(screen.queryByText("Introducing Contacts")).not.toBeOnTheScreen();

    await user.press(await screen.findByRole("button", { name: "Add contact" }));

    expect(await screen.findByText("Sync your wallet to add a contact")).toBeVisible();
    expect(screen.queryByText("Introducing Contacts")).not.toBeOnTheScreen();
  });

  it("should open contact detail when selectContactToPay is off", async () => {
    const { user, yana } = renderContactsSelectForPay({
      selectContactToPay: false,
      title: "Contacts",
    });

    await user.press(await screen.findByTestId(`contacts-saved-contact-${yana.id}`));

    expect(await screen.findByText(`${ScreenName.MyWalletContactDetail}:${yana.id}`)).toBeVisible();
    expect(screen.queryByText("Select Yana's address")).not.toBeOnTheScreen();
  });
});
