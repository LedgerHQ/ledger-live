import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen, withFlagOverrides, waitFor } from "@tests/test-renderer";
import { mockContact, mockContactAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import { useAddAddressFlowViewModel } from "@features/flow-contacts";
import { ScreenName } from "~/const";
import { ContactsButton, ContactsScreen } from "LLM/features/Contacts";
import { ContactDetailScreen } from "LLM/features/Contacts/screens/ContactDetail";
import MyWalletNavigator from "LLM/features/MyWallet/Navigator";
import { useMyWalletHeaderViewModel } from "LLM/features/MyWallet/views/Header/useMyWalletHeaderViewModel";

jest.mock("LLM/features/MyWallet/views/Header/useMyWalletHeaderViewModel");
jest.mock("@features/flow-contacts", () => ({
  ...jest.requireActual<typeof import("@features/flow-contacts")>("@features/flow-contacts"),
  useAddAddressFlowViewModel: jest.fn(),
}));

const mockedViewModel = jest.mocked(useMyWalletHeaderViewModel);
const mockStartAddAddress = jest.fn();

const Stack = createNativeStackNavigator();
const noop = () => undefined;

const contactsNavigationState = {
  index: 1,
  routes: [
    { name: ScreenName.MyWallet, key: "my-wallet" },
    { name: ScreenName.MyWalletContacts, key: "contacts" },
  ],
};

const contactDetailNavigationState = {
  index: 1,
  routes: [
    { name: ScreenName.MyWallet, key: "my-wallet" },
    {
      name: ScreenName.MyWalletContactDetail,
      key: "contact-detail",
      params: { contactId: "contact-me" },
    },
  ],
};

const missingContactDetailNavigationState = {
  index: 1,
  routes: [
    { name: ScreenName.MyWallet, key: "my-wallet" },
    {
      name: ScreenName.MyWalletContactDetail,
      key: "contact-detail",
      params: { contactId: "missing-contact" },
    },
  ],
};

const initialMissingContactDetailNavigationState = {
  index: 0,
  routes: [
    {
      name: ScreenName.MyWalletContactDetail,
      key: "contact-detail",
      params: { contactId: "missing-contact" },
    },
  ],
};

function MyWalletHomeTestScreen() {
  return <Text testID="my-wallet-home">My Wallet</Text>;
}

function ContactsGatingTestApp() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ScreenName.MyWallet} component={MyWalletHomeTestScreen} />
      <Stack.Screen name={ScreenName.MyWalletContacts} component={ContactsScreen} />
      <Stack.Screen name={ScreenName.MyWalletContactDetail} component={ContactDetailScreen} />
    </Stack.Navigator>
  );
}

function renderContactsButton(overrideInitialState: ReturnType<typeof withFlagOverrides>) {
  return render(<ContactsButton />, { overrideInitialState });
}

function withContactsPageReadyState(
  flagOverrides: Parameters<typeof withFlagOverrides>[0],
  patchState?: Parameters<typeof withFlagOverrides>[1],
) {
  return withFlagOverrides(flagOverrides, state => {
    const nextState = patchState ? patchState(state) : state;

    return {
      ...nextState,
      settings: {
        ...nextState.settings,
        hasDismissedContactsFeatureIntroduction: true,
      },
    };
  });
}

describe("Contacts integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAddAddressFlowViewModel).mockReturnValue({
      state: { status: "closed" },
      start: mockStartAddAddress,
      close: jest.fn(),
    });
    mockedViewModel.mockReturnValue({
      onBackPress: noop,
      onNotificationsPress: noop,
      onSettingsPress: noop,
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

  it("should redirect away from the contact detail when lwmContacts is disabled", async () => {
    render(<ContactsGatingTestApp />, {
      navigationInitialState: contactDetailNavigationState,
      overrideInitialState: withFlagOverrides({
        lwmContacts: { enabled: false, params: { newBadge: false } },
      }),
    });

    expect(screen.queryByTestId("contacts-detail-screen")).toBeNull();

    await waitFor(() => {
      expect(screen.getByTestId("my-wallet-home")).toBeVisible();
    });
  });

  it("should redirect away from the contact detail when the contact is missing", async () => {
    render(<ContactsGatingTestApp />, {
      navigationInitialState: missingContactDetailNavigationState,
      overrideInitialState: withFlagOverrides({
        lwmContacts: { enabled: true, params: { newBadge: false } },
      }),
    });

    expect(screen.queryByTestId("contacts-detail-screen")).toBeNull();

    await waitFor(() => {
      expect(screen.getByTestId("my-wallet-home")).toBeVisible();
    });
  });

  it("should replace the first contact detail route with My Wallet when the contact is missing", async () => {
    render(<ContactsGatingTestApp />, {
      navigationInitialState: initialMissingContactDetailNavigationState,
      overrideInitialState: withFlagOverrides({
        lwmContacts: { enabled: true, params: { newBadge: false } },
      }),
    });

    await waitFor(() => {
      expect(screen.getByTestId("my-wallet-home")).toBeVisible();
    });
  });

  it("should render the empty Contacts list when navigated from My Wallet", async () => {
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState({
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

  it("should provide grouped saved contacts from the Contacts slice", async () => {
    const me = mockMeContact();
    const contacts = [
      me,
      mockContact({ id: "contact-zahra", name: "Zahra" }),
      mockContact({
        id: "contact-anna",
        name: "Anna",
        addresses: [mockContactAddress(), mockContactAddress({ id: "address-polygon" })],
      }),
      mockContact({ id: "contact-zhanna", name: "Жанна" }),
    ];
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({ ...state, contacts: { contacts } }),
      ),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-saved-contact-contact-anna")).toHaveTextContent(
        /Anna.*2 addresses/,
      );
      expect(screen.getByTestId("contacts-saved-contact-contact-zahra")).toHaveTextContent(/Zahra/);
      expect(screen.getByTestId("contacts-saved-contact-contact-zhanna")).toHaveTextContent(
        /Жанна/,
      );
    });
  });

  it("should wire the Mobile query to the shared Contacts search model", async () => {
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState({
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

  it("should render the empty Me contact detail state", async () => {
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState({
        lwmContacts: { enabled: true, params: { newBadge: false } },
      }),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-me-item"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-detail-screen")).toBeVisible();
      expect(screen.getByText("No address yet")).toBeVisible();
      expect(screen.getByText("Save a wallet address to receive crypto.")).toBeVisible();
      expect(screen.getByTestId("contacts-detail-add-address")).toBeEnabled();
    });
  });

  it("should render a distinct empty state for another contact", async () => {
    const contact = mockContact({ id: "contact-benoit", name: "Benoit" });
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({
          ...state,
          contacts: { contacts: [mockMeContact(), contact] },
        }),
      ),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-benoit"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-detail-screen")).toBeVisible();
      expect(screen.getByText("Save a wallet address to send to Benoit")).toBeVisible();
      expect(screen.getByTestId("contacts-detail-avatar")).toBeVisible();
    });
  });

  it("should start Add Address for Me without leaving the detail", async () => {
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState({
        lwmContacts: { enabled: true, params: { newBadge: false } },
      }),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-me-item"));

    expect(mockStartAddAddress).not.toHaveBeenCalled();

    await user.press(screen.getByTestId("contacts-detail-add-address"));

    expect(mockStartAddAddress).toHaveBeenCalledTimes(1);
    expect(mockStartAddAddress).toHaveBeenCalledWith("contact-me");
    expect(screen.getByTestId("contacts-detail-screen")).toBeVisible();
  });

  it("should start Add Address with the selected saved contact", async () => {
    const contact = mockContact({ id: "contact-benoit", name: "Benoit" });
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({
          ...state,
          contacts: { contacts: [mockMeContact(), contact] },
        }),
      ),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-benoit"));
    await user.press(screen.getByTestId("contacts-detail-add-address"));

    expect(mockStartAddAddress).toHaveBeenCalledTimes(1);
    expect(mockStartAddAddress).toHaveBeenCalledWith(contact.id);
  });
});
