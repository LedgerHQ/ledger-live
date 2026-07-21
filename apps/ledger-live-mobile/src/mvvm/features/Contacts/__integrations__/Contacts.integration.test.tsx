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
  const { Pressable, Text, TextInput, View } = require("react-native");

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
      searchQuery,
      onSearchQueryChange,
      onOpenContact,
      onAddContact,
    }: {
      viewModel: {
        me?: { contactId: string; name: string; addressCount: number };
        status?: "results" | "no-results";
      };
      labels: {
        searchPlaceholder: string;
        searchNoResults: string;
        addContact: string;
        formatAddressCount: (count: number) => string;
      };
      searchQuery: string;
      onSearchQueryChange: (query: string) => void;
      onOpenContact: (contactId: string) => void;
      onAddContact: () => void;
    }) => {
      const me = viewModel.me;

      return (
        <View testID="contacts-screen">
          <TextInput
            testID="contacts-search-input"
            value={searchQuery}
            onChangeText={onSearchQueryChange}
            placeholder={labels.searchPlaceholder}
          />
          {viewModel.status === "no-results" ? (
            <Text testID="contacts-search-no-results">{labels.searchNoResults}</Text>
          ) : null}
          {me ? (
            <Pressable testID="contacts-me-item" onPress={() => onOpenContact(me.contactId)}>
              <Text>{me.name}</Text>
              <Text>{labels.formatAddressCount(me.addressCount)}</Text>
            </Pressable>
          ) : null}
          {viewModel.status ? null : (
            <Pressable testID="contacts-add-contact-row" onPress={onAddContact}>
              <Text>{labels.addContact}</Text>
            </Pressable>
          )}
        </View>
      );
    },
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

  it("should wire the Mobile query to the shared Contacts search model", async () => {
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withFlagOverrides({
        lwmContacts: { enabled: true, params: { newBadge: false } },
      }),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));

    const input = await screen.findByTestId("contacts-search-input");
    await user.type(input, "Unknown");

    await waitFor(() => {
      expect(screen.getByTestId("contacts-search-no-results")).toHaveTextContent(
        "No contact found",
      );
      expect(screen.queryByTestId("contacts-me-item")).toBeNull();
      expect(screen.queryByTestId("contacts-add-contact-row")).toBeNull();
    });

    await user.clear(input);

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-search-no-results")).toBeNull();
      expect(screen.getByTestId("contacts-add-contact-row")).toBeVisible();
    });

    await user.type(input, "Me");

    await waitFor(() => {
      expect(screen.getByTestId("contacts-me-item")).toHaveTextContent(/Me/);
      expect(screen.queryByTestId("contacts-search-no-results")).toBeNull();
    });
  });
});
