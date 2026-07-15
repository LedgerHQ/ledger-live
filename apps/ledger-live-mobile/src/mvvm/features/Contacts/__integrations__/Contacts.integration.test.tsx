import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen, withFlagOverrides, waitFor } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { ContactsButton, ContactsScreen } from "LLM/features/Contacts";
import MyWalletNavigator from "LLM/features/MyWallet/Navigator";
import { useMyWalletHeaderViewModel } from "LLM/features/MyWallet/views/Header/useMyWalletHeaderViewModel";

jest.mock("@features/flow-contacts", () => {
  const flowContacts = jest.requireActual("@features/flow-contacts");
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");

  return {
    ...flowContacts,
    ContactsButton: ({
      title,
      description,
      newBadgeLabel,
      onPress,
    }: {
      title: string;
      description: string;
      newBadgeLabel?: string;
      onPress: () => void;
    }) => (
      <Pressable testID="my-wallet-contacts-button" onPress={onPress}>
        <Text>{title}</Text>
        <Text>{description}</Text>
        {newBadgeLabel ? <Text testID="contacts-button-new-badge">{newBadgeLabel}</Text> : null}
      </Pressable>
    ),
    ContactsAddContactHeaderButton: ({
      addContactLabel,
      onPress,
    }: {
      addContactLabel: string;
      onPress: () => void;
    }) => (
      <Pressable
        testID="contacts-add-contact-header"
        accessibilityLabel={addContactLabel}
        onPress={onPress}
      >
        <Text>{addContactLabel}</Text>
      </Pressable>
    ),
    ContactsPage: ({
      viewModel,
      labels,
      onOpenMe,
      onAddContact,
    }: {
      viewModel: { me: { contactId: string; name: string; addressCount: number } };
      labels: { searchPlaceholder: string; addContact: string; formatAddressCount: (count: number) => string };
      onOpenMe: (contactId: string) => void;
      onAddContact: () => void;
    }) => (
      <View testID="contacts-screen">
        <Text testID="contacts-search-input">{labels.searchPlaceholder}</Text>
        <Pressable testID="contacts-me-item" onPress={() => onOpenMe(viewModel.me.contactId)}>
          <Text>{viewModel.me.name}</Text>
          <Text>{labels.formatAddressCount(viewModel.me.addressCount)}</Text>
        </Pressable>
        <Pressable testID="contacts-add-contact-row" onPress={onAddContact}>
          <Text>{labels.addContact}</Text>
        </Pressable>
      </View>
    ),
  };
});

jest.mock("LLM/features/MyWallet/views/Header/useMyWalletHeaderViewModel");

const mockedViewModel = jest.mocked(useMyWalletHeaderViewModel);

const mockOnNotificationsPress = jest.fn();
const mockOnSettingsPress = jest.fn();

const Stack = createNativeStackNavigator();

const contactsNavigationState = {
  index: 1,
  routes: [
    { name: ScreenName.MyWallet, key: "my-wallet" },
    { name: ScreenName.MyWalletContacts, key: "contacts" },
  ],
};

function ContactsGatingTestApp() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={ScreenName.MyWallet}
        component={() => <Text testID="my-wallet-home">My Wallet</Text>}
      />
      <Stack.Screen name={ScreenName.MyWalletContacts} component={ContactsScreen} />
    </Stack.Navigator>
  );
}

function renderContactsButton(overrideInitialState: ReturnType<typeof withFlagOverrides>) {
  return render(<ContactsButton />, { overrideInitialState });
}

describe("Contacts integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedViewModel.mockReturnValue({
      onBackPress: jest.fn(),
      onNotificationsPress: mockOnNotificationsPress,
      onSettingsPress: mockOnSettingsPress,
      hasUnreadNotifications: false,
    });
  });

  it("should not render the Contacts button when lwmContacts is disabled", () => {
    renderContactsButton(
      withFlagOverrides({
        lwmContacts: { enabled: false, params: { newBadge: false } },
      }),
    );

    expect(screen.queryByTestId("my-wallet-contacts-button")).toBeNull();
  });

  it("should render the Contacts button without a New badge when enabled and newBadge is false", () => {
    renderContactsButton(
      withFlagOverrides({
        lwmContacts: { enabled: true, params: { newBadge: false } },
      }),
    );

    expect(screen.getByTestId("my-wallet-contacts-button")).toBeVisible();
    expect(screen.queryByTestId("contacts-button-new-badge")).toBeNull();
  });

  it("should render the Contacts button with a New badge when enabled and newBadge is true", () => {
    renderContactsButton(
      withFlagOverrides({
        lwmContacts: { enabled: true, params: { newBadge: true } },
      }),
    );

    expect(screen.getByTestId("my-wallet-contacts-button")).toBeVisible();
    expect(screen.getByTestId("contacts-button-new-badge")).toBeVisible();
  });

  it("should show the Contacts button in My Wallet when the feature flag is enabled", () => {
    render(<MyWalletNavigator />, {
      overrideInitialState: withFlagOverrides({
        lwmContacts: { enabled: true, params: { newBadge: false } },
      }),
    });

    expect(screen.getByTestId("my-wallet-contacts-button")).toBeVisible();
  });

  it("should redirect away from the Contacts page when lwmContacts is disabled", async () => {
    render(<ContactsGatingTestApp />, {
      navigationInitialState: contactsNavigationState,
      overrideInitialState: withFlagOverrides({
        lwmContacts: { enabled: false, params: { newBadge: false } },
      }),
    });

    expect(screen.queryByTestId("contacts-screen")).toBeNull();

    await waitFor(() => {
      expect(screen.getByTestId("my-wallet-home")).toBeVisible();
    });
  });

  it("should render the empty Contacts list when navigated from My Wallet", async () => {
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withFlagOverrides({
        lwmContacts: { enabled: true, params: { newBadge: false } },
      }),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-screen")).toBeVisible();
      expect(screen.getByTestId("contacts-add-contact-header")).toBeEnabled();
      expect(screen.getByTestId("contacts-me-item")).toHaveTextContent(/Me/);
      expect(screen.getByTestId("contacts-me-item")).toHaveTextContent(/0 address/);
      expect(screen.getByTestId("contacts-add-contact-row")).toBeVisible();
    });
  });
});
