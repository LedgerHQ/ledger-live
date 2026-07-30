import React from "react";
import Clipboard from "@react-native-clipboard/clipboard";
import { Pressable, Text } from "react-native";
import type { RouteProp } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { render, screen, withFlagOverrides, waitFor } from "@tests/test-renderer";
import type { ContactId } from "@domain/entity-contact";
import {
  mockContact,
  mockContactAddress,
  mockMeContact,
  mockPopulatedContacts,
} from "@domain/entity-contact/schema.mock";
import { ContactDetailView } from "@features/flow-contacts";
import { NavigatorName, ScreenName } from "~/const";
import type { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import { ContactsButton, ContactsScreen } from "LLM/features/Contacts";
import { ContactDetailScreen } from "LLM/features/Contacts/screens/ContactDetail";
import { ContactsAddAddressFlowDrawer } from "LLM/features/Contacts/screens/ContactDetail/components/ContactsAddAddressFlowDrawer";
import { useContactDetailScreenViewModel } from "LLM/features/Contacts/screens/ContactDetail/useContactDetailScreenViewModel";
import MyWalletNavigator from "LLM/features/MyWallet/Navigator";
import { useMyWalletHeaderViewModel } from "LLM/features/MyWallet/views/Header/useMyWalletHeaderViewModel";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { mockEthCryptoCurrency } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";

jest.mock("LLM/features/MyWallet/views/Header/useMyWalletHeaderViewModel");
jest.mock("LLM/features/Contacts/hooks/useContactsAddressValidationAdapter", () => ({
  useContactsAddressValidationAdapter: () => ({
    validateAddress: async ({ address }: { address: string }) => ({
      status: "valid",
      resolvedAddress: address,
      isDomain: false,
    }),
  }),
}));

const mockedViewModel = jest.mocked(useMyWalletHeaderViewModel);

const Stack = createNativeStackNavigator();
const AccountsStack = createNativeStackNavigator<AccountsNavigatorParamList>();
type AddressEntryTestStackParamList = {
  [ScreenName.MyWallet]: undefined;
  [ScreenName.MyWalletContactDetail]: { contactId: ContactId };
  [ScreenName.ScanRecipient]: {
    onScanned: (value: string) => void;
  };
};
const AddressEntryStack = createNativeStackNavigator<AddressEntryTestStackParamList>();
const noop = () => undefined;
const SCANNED_ADDRESS = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";

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

const savedContactDetailNavigationState = {
  index: 1,
  routes: [
    { name: ScreenName.MyWallet, key: "my-wallet" },
    {
      name: ScreenName.MyWalletContactDetail,
      key: "contact-detail",
      params: { contactId: "contact-benoit" },
    },
  ],
};

const ledgerWalletAddressesNavigationState = {
  index: 0,
  routes: [
    {
      name: NavigatorName.MyWallet,
      state: contactDetailNavigationState,
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

function AccountsListTestScreen() {
  return <Text testID="accounts-list-screen">Accounts list</Text>;
}

function CryptoAddressesTestScreen({
  route,
}: Readonly<{
  route: RouteProp<AccountsNavigatorParamList, typeof ScreenName.CryptoAddresses>;
}>) {
  return <Text testID="crypto-addresses-screen">{route.params.sourceScreenName}</Text>;
}

function AccountsNavigationTestApp() {
  return (
    <AccountsStack.Navigator
      initialRouteName={ScreenName.AccountsList}
      screenOptions={{ headerShown: false }}
    >
      <AccountsStack.Screen name={ScreenName.AccountsList} component={AccountsListTestScreen} />
      <AccountsStack.Screen
        name={ScreenName.CryptoAddresses}
        component={CryptoAddressesTestScreen}
      />
    </AccountsStack.Navigator>
  );
}

function LedgerWalletAddressesNavigationTestApp() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={NavigatorName.MyWallet} component={MyWalletNavigator} />
      <Stack.Screen name={NavigatorName.Accounts} component={AccountsNavigationTestApp} />
    </Stack.Navigator>
  );
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

function ContactDetailViewModelProbe() {
  const viewModel = useContactDetailScreenViewModel();

  if (viewModel.status === "redirecting") {
    return null;
  }

  const stateLabel = (() => {
    switch (viewModel.addAddressFlowState.status) {
      case "closed":
        return "closed";
      case "selectingCurrency":
        return `selectingCurrency:${viewModel.addAddressFlowState.selectedContactId}`;
      case "enteringAddress":
        return `enteringAddress:${viewModel.addAddressFlowState.selectedContactId}:${viewModel.addAddressFlowState.selectedCurrencyId}`;
      case "namingAddress":
      case "reviewingAddress":
      case "success":
        return viewModel.addAddressFlowState.status;
    }
  })();

  return (
    <>
      <Text testID="contacts-add-address-flow-state">{stateLabel}</Text>
      <Pressable
        accessibilityRole="button"
        testID="contacts-start-add-address"
        onPress={viewModel.pageProps.onAddAddress}
      >
        <Text>Start Add Address</Text>
      </Pressable>
      {viewModel.addAddressFlowState.status === "selectingCurrency" ? (
        <>
          <Pressable
            testID="contacts-select-currency"
            onPress={() =>
              viewModel.addAddressFlowProps.onCurrencySelected(mockEthCryptoCurrency.id)
            }
          >
            <Text>Select currency</Text>
          </Pressable>
          <Pressable
            testID="contacts-cancel-currency"
            onPress={viewModel.addAddressFlowProps.onClose}
          >
            <Text>Cancel currency</Text>
          </Pressable>
        </>
      ) : null}
    </>
  );
}

function ContactDetailViewModelTestApp() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ScreenName.MyWallet} component={MyWalletHomeTestScreen} />
      <Stack.Screen
        name={ScreenName.MyWalletContactDetail}
        component={ContactDetailViewModelProbe}
      />
    </Stack.Navigator>
  );
}

function ContactDetailAddressEntryTestScreen() {
  const viewModel = useContactDetailScreenViewModel();
  const { handleCurrencySelected } = useModularDrawerController();

  if (viewModel.status === "redirecting") {
    return null;
  }

  return (
    <>
      <ContactDetailView {...viewModel.pageProps} />
      {viewModel.addAddressFlowState.status !== "closed" ? (
        <ContactsAddAddressFlowDrawer {...viewModel.addAddressFlowProps} />
      ) : null}
      {viewModel.addAddressFlowState.status === "selectingCurrency" ? (
        <Pressable
          testID="contacts-address-entry-select-currency"
          onPress={() => handleCurrencySelected(mockEthCryptoCurrency)}
        >
          <Text>Select currency</Text>
        </Pressable>
      ) : null}
    </>
  );
}

function ScanRecipientTestScreen({
  navigation,
  route,
}: NativeStackScreenProps<
  AddressEntryTestStackParamList,
  typeof ScreenName.ScanRecipient
>): React.JSX.Element {
  return (
    <Pressable
      testID="contacts-scan-address"
      onPress={() => {
        route.params.onScanned(SCANNED_ADDRESS);
        navigation.goBack();
      }}
    >
      <Text>Scan address</Text>
    </Pressable>
  );
}

function ContactDetailAddressEntryTestApp() {
  return (
    <AddressEntryStack.Navigator screenOptions={{ headerShown: false }}>
      <AddressEntryStack.Screen name={ScreenName.MyWallet} component={MyWalletHomeTestScreen} />
      <AddressEntryStack.Screen
        name={ScreenName.MyWalletContactDetail}
        component={ContactDetailAddressEntryTestScreen}
      />
      <AddressEntryStack.Screen
        name={ScreenName.ScanRecipient}
        component={ScanRecipientTestScreen}
      />
    </AddressEntryStack.Navigator>
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
      expect(screen.getByText("My addresses")).toBeVisible();
      expect(screen.getByTestId("contacts-detail-add-address")).toHaveTextContent(
        "Add your address",
      );
      expect(screen.getByTestId("contacts-detail-ledger-wallet-addresses")).toHaveTextContent(
        "Ledger Wallet addresses",
      );
      expect(screen.getByText("Save your own addresses")).toBeVisible();
      expect(
        screen.getByText(
          "Save the external addresses you own on exchanges or other wallets. Next time you send to yourself, your Ledger device will show the name you chose.",
        ),
      ).toBeVisible();
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
      expect(screen.getByTestId("contacts-detail-add-address")).toHaveTextContent("Add address");
      expect(screen.getByText("Save a wallet address to send to Benoit")).toBeVisible();
      expect(screen.getByTestId("contacts-detail-avatar")).toBeVisible();
      expect(screen.queryByTestId("contacts-detail-ledger-wallet-addresses")).toBeNull();
    });
  });
  it("should expose the Add Address session started for Me", async () => {
    const { user } = render(<ContactDetailViewModelTestApp />, {
      navigationInitialState: contactDetailNavigationState,
      overrideInitialState: withContactsPageReadyState({
        lwmContacts: { enabled: true, params: { newBadge: false } },
      }),
    });

    expect(screen.getByTestId("contacts-add-address-flow-state")).toHaveTextContent("closed");

    await user.press(screen.getByTestId("contacts-start-add-address"));

    expect(screen.getByTestId("contacts-add-address-flow-state")).toHaveTextContent(
      "selectingCurrency:contact-me",
    );

    await user.press(screen.getByTestId("contacts-cancel-currency"));
    await waitFor(() =>
      expect(screen.getByTestId("contacts-add-address-flow-state")).toHaveTextContent("closed"),
    );
  });

  it("should not start Add Address when no production network is eligible", async () => {
    const { user } = render(<ContactDetailViewModelTestApp />, {
      navigationInitialState: contactDetailNavigationState,
      overrideInitialState: withContactsPageReadyState({
        lwmContacts: {
          enabled: true,
          params: { newBadge: false, eligibleAddressFamilies: ["unknown"] },
        },
      }),
    });

    await user.press(screen.getByTestId("contacts-start-add-address"));

    expect(screen.getByTestId("contacts-add-address-flow-state")).toHaveTextContent("closed");
  });

  it("should expose the Add Address session started for a saved contact", async () => {
    const contact = mockContact({ id: "contact-benoit", name: "Benoit" });
    const { user } = render(<ContactDetailViewModelTestApp />, {
      navigationInitialState: savedContactDetailNavigationState,
      overrideInitialState: withContactsPageReadyState(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({
          ...state,
          contacts: { contacts: [mockMeContact(), contact] },
        }),
      ),
    });

    await user.press(screen.getByTestId("contacts-start-add-address"));

    expect(screen.getByTestId("contacts-add-address-flow-state")).toHaveTextContent(
      `selectingCurrency:${contact.id}`,
    );

    await user.press(screen.getByTestId("contacts-cancel-currency"));
  });

  it("should continue Add Address with the final currency selected in the shared drawer", async () => {
    const { user } = render(<ContactDetailViewModelTestApp />, {
      navigationInitialState: contactDetailNavigationState,
      overrideInitialState: withContactsPageReadyState({
        lwmContacts: {
          enabled: true,
          params: { newBadge: false, eligibleAddressFamilies: ["evm"] },
        },
      }),
    });

    await user.press(screen.getByTestId("contacts-start-add-address"));

    expect(screen.getByTestId("contacts-add-address-flow-state")).toHaveTextContent(
      "selectingCurrency:contact-me",
    );

    await user.press(screen.getByTestId("contacts-select-currency"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-add-address-flow-state")).toHaveTextContent(
        `enteringAddress:contact-me:${mockEthCryptoCurrency.id}`,
      );
    });
  });

  it("should keep one Add Address drawer through QR, placeholders and success", async () => {
    const { user } = render(<ContactDetailAddressEntryTestApp />, {
      navigationInitialState: contactDetailNavigationState,
      overrideInitialState: withContactsPageReadyState({
        lwmContacts: {
          enabled: true,
          params: { newBadge: false, eligibleAddressFamilies: ["evm"] },
        },
      }),
    });

    await user.press(screen.getByTestId("contacts-detail-add-address"));
    await user.press(screen.getByTestId("contacts-address-entry-select-currency"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-add-address-input")).toHaveProp(
        "placeholder",
        "Address or ENS",
      );
      expect(screen.getByTestId("bottom-sheet-header-title")).toHaveTextContent("Enter address");
      expect(screen.getByTestId("contacts-add-address-confirm")).toBeDisabled();
      expect(screen.getByTestId("contacts-add-address-step-frame")).toHaveStyle({
        height: "100%",
      });
      expect(screen.getByTestId("contacts-detail-screen")).toBeVisible();
    });

    await user.press(await screen.findByLabelText("Scan QR code"));
    await user.press(await screen.findByTestId("contacts-scan-address"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-add-address-input")).toHaveProp("value", SCANNED_ADDRESS);
      expect(screen.getByTestId("bottom-sheet-header-title")).toHaveTextContent("Enter address");
      expect(screen.getByTestId("contacts-add-address-confirm")).toBeEnabled();
    });

    await user.press(screen.getByTestId("contacts-add-address-confirm"));
    expect(await screen.findByTestId("contacts-add-address-name-screen-continue")).toBeVisible();

    await user.press(screen.getByTestId("contacts-add-address-name-screen-continue"));
    expect(await screen.findByTestId("contacts-add-address-review-screen-continue")).toBeVisible();

    await user.press(screen.getByTestId("contacts-add-address-review-screen-continue"));
    expect(await screen.findByTestId("contacts-add-address-success-screen-continue")).toBeVisible();

    await user.press(screen.getByTestId("contacts-add-address-success-screen-continue"));
    await waitFor(() => {
      expect(screen.queryByTestId("contacts-add-address-flow-drawer")).toBeNull();
      expect(screen.getByTestId("contacts-detail-screen")).toBeVisible();
    });
  });

  it("should return to currency selection without removing the contact detail route", async () => {
    const { user } = render(<ContactDetailAddressEntryTestApp />, {
      navigationInitialState: contactDetailNavigationState,
      overrideInitialState: withContactsPageReadyState({
        lwmContacts: {
          enabled: true,
          params: { newBadge: false, eligibleAddressFamilies: ["evm"] },
        },
      }),
    });

    await user.press(screen.getByTestId("contacts-detail-add-address"));
    await user.press(screen.getByTestId("contacts-address-entry-select-currency"));
    expect(await screen.findByTestId("contacts-add-address-input")).toBeVisible();

    await user.press(screen.getByTestId("bottom-sheet-header-back-button"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-detail-screen")).toBeVisible();
      expect(screen.queryByTestId("contacts-add-address-input")).toBeNull();
      expect(screen.getByTestId("contacts-address-entry-select-currency")).toBeVisible();
      expect(screen.queryByTestId("my-wallet-home")).toBeNull();
    });
  });

  it("should open Ledger Wallet addresses from the Me contact detail", async () => {
    const { user } = render(<LedgerWalletAddressesNavigationTestApp />, {
      navigationInitialState: ledgerWalletAddressesNavigationState,
      overrideInitialState: withContactsPageReadyState({
        lwmContacts: { enabled: true, params: { newBadge: false } },
      }),
    });

    await user.press(await screen.findByTestId("contacts-detail-ledger-wallet-addresses"));

    expect(await screen.findByTestId("crypto-addresses-screen")).toHaveTextContent(
      ScreenName.MyWalletContactDetail,
    );
    expect(screen.queryByTestId("accounts-list-screen")).toBeNull();
  });

  it("should render populated contact detail when a contact with addresses is opened", async () => {
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({ ...state, contacts: { contacts: mockPopulatedContacts() } }),
      ),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ben"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-detail-screen")).toBeVisible();
      expect(screen.getByText("2 addresses")).toBeVisible();
      expect(screen.getByTestId("contacts-detail-address-list")).toBeVisible();
      expect(screen.getByTestId("contacts-detail-network-group-ethereum")).toBeVisible();
      expect(screen.getByTestId("contacts-detail-network-group-polygon")).toBeVisible();
      expect(screen.getByTestId("contacts-detail-address-row-address-ethereum")).toBeVisible();
      expect(screen.getByTestId("contacts-detail-address-row-address-polygon")).toBeVisible();
      expect(screen.queryByTestId("contacts-detail-empty-state")).toBeNull();
    });
  });

  it("should open the address detail sheet when an address row is pressed", async () => {
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({ ...state, contacts: { contacts: mockPopulatedContacts() } }),
      ),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ben"));
    await user.press(await screen.findByTestId("contacts-detail-address-row-address-ethereum"));

    expect(await screen.findByTestId("contacts-address-detail-dialog")).toBeVisible();
    await waitFor(() => {
      expect(screen.getByTestId("contacts-address-detail-network-tag")).toHaveTextContent(
        "Ethereum Network",
      );
      expect(screen.getByTestId("contacts-address-detail-full-address")).toHaveTextContent(
        "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
      );
      expect(screen.getByTestId("contacts-address-detail-qr-code")).toBeVisible();
    });
  });

  it("should copy the address from the detail sheet", async () => {
    const setString = jest.spyOn(Clipboard, "setString");
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({ ...state, contacts: { contacts: mockPopulatedContacts() } }),
      ),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ben"));
    await user.press(await screen.findByTestId("contacts-detail-address-row-address-ethereum"));
    await user.press(await screen.findByTestId("contacts-address-detail-copy"));

    await waitFor(() => {
      expect(setString).toHaveBeenCalledWith("0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034");
      expect(screen.getByTestId("contacts-address-detail-copy")).toHaveTextContent("Copied");
    });
  });
});
