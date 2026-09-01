import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { ContactsScreen } from "LLM/features/Contacts";
import { useContactsLedgerSyncStatus } from "LLM/features/Contacts/hooks/useContactsLedgerSyncStatus";
import MyWalletNavigator from "LLM/features/MyWallet/Navigator";
import { useMyWalletHeaderViewModel } from "LLM/features/MyWallet/views/Header/useMyWalletHeaderViewModel";

jest.mock("LLM/features/MyWallet/views/Header/useMyWalletHeaderViewModel");
jest.mock("LLM/features/Contacts/hooks/useContactsLedgerSyncStatus");

const mockedViewModel = jest.mocked(useMyWalletHeaderViewModel);
const mockedContactsLedgerSyncStatus = jest.mocked(useContactsLedgerSyncStatus);

const Stack = createNativeStackNavigator();

const contactsNavigationState = {
  index: 1,
  routes: [
    { name: ScreenName.MyWallet, key: "my-wallet" },
    { name: ScreenName.MyWalletContacts, key: "contacts" },
  ],
};

function ContactsFeatureIntroductionTestApp() {
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

describe("Contacts feature introduction integration", () => {
  beforeEach(() => {
    mockedContactsLedgerSyncStatus.mockReturnValue("ready");
    mockedViewModel.mockReturnValue({
      onBackPress: jest.fn(),
      onNotificationsPress: jest.fn(),
      onSettingsPress: jest.fn(),
      hasUnreadNotifications: false,
    });
  });

  it("should show the introduction drawer over the Contacts page on first visit", async () => {
    render(<ContactsFeatureIntroductionTestApp />, {
      navigationInitialState: contactsNavigationState,
      overrideInitialState: withFlagOverrides(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({
          ...state,
          settings: { ...state.settings, hasDismissedContactsFeatureIntroduction: false },
        }),
      ),
    });

    expect(screen.getByTestId("contacts-screen")).toBeVisible();
    await waitFor(() => {
      expect(screen.getByText("Introducing Contacts")).toBeVisible();
      expect(screen.getByTestId("contacts-feature-introduction-primary")).toBeVisible();
    });
    expect(screen.queryByText("Sync your wallet to add a contact")).toBeNull();
  });

  it("should persist dismissal from Explore now and keep the Contacts page available", async () => {
    const { user, store } = render(<ContactsFeatureIntroductionTestApp />, {
      navigationInitialState: contactsNavigationState,
      overrideInitialState: withFlagOverrides(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({
          ...state,
          settings: { ...state.settings, hasDismissedContactsFeatureIntroduction: false },
        }),
      ),
    });

    await user.press(screen.getByTestId("contacts-feature-introduction-primary"));

    await waitFor(() => {
      expect(store.getState().settings.hasDismissedContactsFeatureIntroduction).toBe(true);
      expect(screen.queryByTestId("contacts-feature-introduction-primary")).toBeNull();
      expect(screen.getByTestId("contacts-screen")).toBeVisible();
    });
  });

  it("should navigate to the introduction from My Wallet when the feature flag is enabled", async () => {
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withFlagOverrides(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({
          ...state,
          settings: { ...state.settings, hasDismissedContactsFeatureIntroduction: false },
        }),
      ),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));

    await waitFor(() => {
      expect(screen.getByText("Introducing Contacts")).toBeVisible();
      expect(screen.getByTestId("contacts-screen")).toBeVisible();
    });
  });
});
