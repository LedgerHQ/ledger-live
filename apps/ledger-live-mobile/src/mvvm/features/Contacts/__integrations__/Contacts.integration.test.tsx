import React from "react";
import Clipboard from "@react-native-clipboard/clipboard";
import { Pressable, Text } from "react-native";
import type { RouteProp } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { render, screen, withFlagOverrides, waitFor, within } from "@tests/test-renderer";
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
import { useContactsLedgerSyncStatus } from "LLM/features/Contacts/hooks/useContactsLedgerSyncStatus";
import MyWalletNavigator from "LLM/features/MyWallet/Navigator";
import { useMyWalletHeaderViewModel } from "LLM/features/MyWallet/views/Header/useMyWalletHeaderViewModel";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { mockEthCryptoCurrency } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";

const mockHandleOpenSendFlow = jest.fn();
jest.mock("LLM/features/Send/hooks/useOpenSendFlow", () => ({
  useOpenSendFlow: () => ({ handleOpenSendFlow: mockHandleOpenSendFlow }),
}));

jest.mock("LLM/features/MyWallet/views/Header/useMyWalletHeaderViewModel");
jest.mock("LLM/features/Contacts/hooks/useContactsLedgerSyncStatus");
jest.mock("LLM/features/WalletSync/screens/Activation/ActivationDrawer", () => ({
  __esModule: true,
  default: ({ isOpen, startingStep }: { isOpen: boolean; startingStep: string }) =>
    isOpen ? <Text testID={`wallet-sync-drawer-${startingStep}`}>{startingStep}</Text> : null,
}));
// Device intents resolve without a device so these tests cover the calling flows only.
// The executor wiring is covered by Contacts.deviceIntents.integration.test.tsx.
jest.mock("@features/platform-contacts/device");
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
const mockedContactsLedgerSyncStatus = jest.mocked(useContactsLedgerSyncStatus);

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

function WalletSyncActivationTestScreen() {
  return <Text testID="wallet-sync-activation">Wallet Sync activation</Text>;
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
      <Stack.Screen name={NavigatorName.WalletSync} component={WalletSyncActivationTestScreen} />
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
      case "confirmationRequired":
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
              viewModel.addAddressFlowProps.onCurrencySelected({
                currencyId: mockEthCryptoCurrency.id,
                assetDisplayName: mockEthCryptoCurrency.name,
              })
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

/** Row labels in render order. Disabled rows are only reachable through their explanation wrapper. */
function getRenderedRowLabels(prefix: "asset-item" | "network-item") {
  return screen
    .getAllByTestId(new RegExp(`^${prefix}-`))
    .map(row =>
      String(row.props.testID).replace(`${prefix}-explanation-`, "").replace(`${prefix}-`, ""),
    );
}

const evmOnlyContactsFeatureFlag: Parameters<typeof withContactsPageReadyState>[0] = {
  lwmContacts: {
    enabled: true,
    params: { newBadge: false, eligibleAddressFamilies: ["evm"] },
  },
};

describe("Contacts integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedContactsLedgerSyncStatus.mockReturnValue("ready");
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
      expect(screen.queryByTestId("contacts-add-contact-header")).toBeNull();
    });

    await user.clear(input);

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-search-no-results")).toBeNull();
      expect(screen.getByTestId("contacts-add-contact-row")).toBeVisible();
      expect(screen.getByTestId("contacts-add-contact-header")).toBeVisible();
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
      expect(screen.getByText("Me")).toBeVisible();
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
      expect(screen.getByText("No saved addresses for Benoit")).toBeVisible();
      expect(
        screen.getByText("Save their wallet addresses to send to them by name next time"),
      ).toBeVisible();
      expect(screen.getByTestId("contacts-detail-avatar")).toBeVisible();
      expect(screen.queryByTestId("contacts-detail-ledger-wallet-addresses")).toBeNull();
    });
  });

  it("should open Wallet Sync activation instead of Add Address when sync is inactive", async () => {
    mockedContactsLedgerSyncStatus.mockReturnValue("inactive");
    const { user } = render(<ContactsGatingTestApp />, {
      navigationInitialState: contactDetailNavigationState,
      overrideInitialState: withContactsPageReadyState({
        lwmContacts: { enabled: true, params: { newBadge: false } },
      }),
    });

    await user.press(await screen.findByTestId("contacts-detail-add-address"));

    expect(screen.getByText("Sync your wallet to add a contact")).toBeVisible();
    expect(screen.queryByTestId("contacts-add-address-flow-drawer")).toBeNull();

    await user.press(screen.getByRole("button", { name: "Sync my wallet" }));

    await waitFor(() => {
      expect(screen.getByTestId("wallet-sync-drawer-ChooseSyncMethod")).toBeVisible();
    });
    expect(screen.queryByTestId("wallet-sync-activation")).toBeNull();
  });

  it("should open Wallet Sync activation instead of Add Contact when sync is unavailable", async () => {
    mockedContactsLedgerSyncStatus.mockReturnValue("unavailable");
    const { user } = render(<ContactsGatingTestApp />, {
      navigationInitialState: contactsNavigationState,
      overrideInitialState: withContactsPageReadyState({
        lwmContacts: { enabled: true, params: { newBadge: false } },
      }),
    });

    expect(screen.queryByText("Sync your wallet to add a contact")).toBeNull();

    await user.press(await screen.findByTestId("contacts-add-contact-row"));

    await waitFor(() => {
      expect(screen.getByText("Sync your wallet to add a contact")).toBeVisible();
    });
    expect(screen.queryByTestId("contacts-add-contact-drawer")).toBeNull();

    await user.press(screen.getByRole("button", { name: "Sync my wallet" }));

    await waitFor(() => {
      expect(screen.getByTestId("wallet-sync-drawer-ChooseSyncMethod")).toBeVisible();
    });
    expect(screen.queryByTestId("wallet-sync-activation")).toBeNull();
  });

  it("should open Wallet Sync activation instead of Add Address when sync is unavailable", async () => {
    mockedContactsLedgerSyncStatus.mockReturnValue("unavailable");
    const { user } = render(<ContactsGatingTestApp />, {
      navigationInitialState: contactDetailNavigationState,
      overrideInitialState: withContactsPageReadyState({
        lwmContacts: { enabled: true, params: { newBadge: false } },
      }),
    });

    await user.press(await screen.findByTestId("contacts-detail-add-address"));

    await waitFor(() => {
      expect(screen.getByText("Sync your wallet to add a contact")).toBeVisible();
    });
    expect(screen.queryByTestId("contacts-add-address-flow-drawer")).toBeNull();

    await user.press(screen.getByRole("button", { name: "Sync my wallet" }));

    await waitFor(() => {
      expect(screen.getByTestId("wallet-sync-drawer-ChooseSyncMethod")).toBeVisible();
    });
    expect(screen.queryByTestId("wallet-sync-activation")).toBeNull();
  });

  it("should not open the Ledger Sync introduction when landing on Contacts", async () => {
    mockedContactsLedgerSyncStatus.mockReturnValue("inactive");
    render(<ContactsGatingTestApp />, {
      navigationInitialState: contactsNavigationState,
      overrideInitialState: withContactsPageReadyState({
        lwmContacts: { enabled: true, params: { newBadge: false } },
      }),
    });

    expect(await screen.findByTestId("contacts-screen")).toBeVisible();
    expect(screen.queryByText("Sync your wallet to add a contact")).toBeNull();
  });

  it("should dismiss the Ledger Sync introduction from the secondary action", async () => {
    mockedContactsLedgerSyncStatus.mockReturnValue("inactive");
    const { user } = render(<ContactsGatingTestApp />, {
      navigationInitialState: contactsNavigationState,
      overrideInitialState: withContactsPageReadyState({
        lwmContacts: { enabled: true, params: { newBadge: false } },
      }),
    });

    await user.press(await screen.findByTestId("contacts-add-contact-row"));
    await user.press(await screen.findByRole("button", { name: "Not now" }));

    await waitFor(() => {
      expect(screen.queryByText("Sync your wallet to add a contact")).toBeNull();
    });
    expect(screen.queryByTestId("wallet-sync-drawer-ChooseSyncMethod")).toBeNull();
  });

  it.each(["checking"] as const)(
    "should keep Contacts read-only while sync is %s",
    async ledgerSyncStatus => {
      mockedContactsLedgerSyncStatus.mockReturnValue(ledgerSyncStatus);
      const { user } = render(<ContactsGatingTestApp />, {
        navigationInitialState: contactDetailNavigationState,
        overrideInitialState: withContactsPageReadyState({
          lwmContacts: { enabled: true, params: { newBadge: false } },
        }),
      });

      await user.press(await screen.findByTestId("contacts-detail-add-address"));

      expect(screen.queryByTestId("contacts-add-address-flow-drawer")).toBeNull();
      expect(screen.queryByText("Sync your wallet to add a contact")).toBeNull();
    },
  );
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
      overrideInitialState: withContactsPageReadyState(evmOnlyContactsFeatureFlag),
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

  it("should save an address to the selected contact after device confirmation", async () => {
    const contact = mockContact({ id: "contact-benoit", name: "Benoit" });
    const { user } = render(<ContactDetailAddressEntryTestApp />, {
      navigationInitialState: savedContactDetailNavigationState,
      overrideInitialState: withContactsPageReadyState(evmOnlyContactsFeatureFlag, state => ({
        ...state,
        contacts: { contacts: [mockMeContact(), contact] },
      })),
    });

    await user.press(screen.getByTestId("contacts-detail-add-address"));
    await user.press(screen.getByTestId("contacts-address-entry-select-currency"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-add-address-input")).toHaveProp(
        "placeholder",
        "Address or ENS",
      );
      expect(screen.getByText("Enter address")).toBeVisible();
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
      expect(screen.getByText("Enter address")).toBeVisible();
      expect(screen.getByTestId("contacts-add-address-confirm")).toBeEnabled();
    });

    await user.press(screen.getByTestId("contacts-add-address-confirm"));
    const addressNameInput = await screen.findByTestId("contacts-add-address-name-input");
    expect(addressNameInput).toHaveProp("value", mockEthCryptoCurrency.name);
    expect(addressNameInput).toHaveProp("maxLength", 32);
    expect(screen.getByTestId("contacts-add-address-name-count")).toHaveTextContent("8/32");
    expect(screen.getByText("Name address")).toBeVisible();
    expect(
      screen.getByText(
        "We recommend giving this address a name to easily find it when needed. It will be only visible by you.",
      ),
    ).toBeVisible();
    expect(screen.getByTestId("contacts-add-address-name-continue")).toBeEnabled();

    await user.clear(addressNameInput);
    await user.type(addressNameInput, "Exchange");
    expect(screen.getByTestId("contacts-add-address-name-input")).toHaveProp("value", "Exchange");

    await user.press(screen.getByTestId("contacts-add-address-name-continue"));
    await waitFor(() => {
      expect(screen.queryByTestId("contacts-add-address-flow-drawer")).toBeNull();
      expect(screen.getByTestId("contacts-detail-screen")).toBeVisible();
      expect(screen.getByTestId("contacts-detail-network-group-ethereum")).toBeVisible();
      expect(screen.getByText("Exchange")).toBeVisible();
    });
  });

  it.each(["address", "name"] as const)("should close Add Address from the %s step", async step => {
    const contact = mockContact({ id: "contact-benoit", name: "Benoit" });
    const { user } = render(<ContactDetailAddressEntryTestApp />, {
      navigationInitialState: savedContactDetailNavigationState,
      overrideInitialState: withContactsPageReadyState(evmOnlyContactsFeatureFlag, state => ({
        ...state,
        contacts: { contacts: [mockMeContact(), contact] },
      })),
    });

    await user.press(screen.getByTestId("contacts-detail-add-address"));
    await user.press(screen.getByTestId("contacts-address-entry-select-currency"));

    const addressInput = await screen.findByTestId("contacts-add-address-input");

    if (step === "name") {
      await user.type(addressInput, SCANNED_ADDRESS);

      await waitFor(() => {
        expect(screen.getByTestId("contacts-add-address-confirm")).toBeEnabled();
      });

      await user.press(screen.getByTestId("contacts-add-address-confirm"));
      expect(await screen.findByTestId("contacts-add-address-name-input")).toBeVisible();
    } else {
      expect(addressInput).toBeVisible();
    }

    const closeButton = screen.getByTestId("bottom-sheet-header-close-button");
    expect(closeButton).toBeVisible();

    await user.press(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-add-address-flow-drawer")).toBeNull();
      expect(screen.getByTestId("contacts-detail-screen")).toBeVisible();
    });
  });

  it("should keep the currency selector usable when searching for a network", async () => {
    const { user } = render(<ContactDetailAddressEntryTestApp />, {
      navigationInitialState: contactDetailNavigationState,
      overrideInitialState: withContactsPageReadyState(evmOnlyContactsFeatureFlag),
    });

    await user.press(screen.getByTestId("contacts-detail-add-address"));

    const searchInput = await screen.findByTestId("modular-drawer-search-input");
    await user.press(searchInput);
    await user.type(searchInput, "ethereum");

    await waitFor(() => {
      expect(screen.getByTestId("modular-drawer-search-input")).toBeVisible();
      expect(screen.getByText(/ethereum/i)).toBeVisible();
    });
  });

  it("should keep the standard catalog visible while disabling ineligible asset and network rows", async () => {
    const { user } = render(<ContactDetailAddressEntryTestApp />, {
      navigationInitialState: contactDetailNavigationState,
      overrideInitialState: withContactsPageReadyState(evmOnlyContactsFeatureFlag),
    });

    await user.press(screen.getByTestId("contacts-detail-add-address"));

    const bitcoinAsset = await screen.findByTestId("asset-item-explanation-BTC");
    const tetherAsset = screen.getByTestId("asset-item-USDT");
    expect(bitcoinAsset).toBeEnabled();
    expect(tetherAsset).toBeEnabled();

    await user.press(bitcoinAsset);

    await waitFor(() => {
      expect(screen.getByText("Bitcoin isn't supported yet")).toBeVisible();
      expect(
        screen.getByText(
          "You can't add a Bitcoin address to your contacts yet. We're adding more cryptos over time.",
        ),
      ).toBeVisible();
    });
    expect(screen.queryByTestId("contacts-add-address-input")).toBeNull();

    await user.press(screen.getByRole("button", { name: "Got it" }));

    await waitFor(() => {
      expect(screen.queryByText("Bitcoin isn't supported yet")).toBeNull();
    });
    expect(
      screen.getByLabelText("Bitcoin isn't supported yet", {
        exact: true,
      }),
    ).toBeVisible();

    await user.press(tetherAsset);

    const solanaNetwork = await screen.findByTestId("network-item-explanation-Solana");
    const ethereumNetwork = screen.getByTestId("network-item-Ethereum");
    expect(solanaNetwork).toBeEnabled();
    expect(ethereumNetwork).toBeEnabled();

    await user.press(solanaNetwork);

    await waitFor(() => {
      expect(screen.getByText("Solana Network isn't supported yet")).toBeVisible();
      expect(
        screen.getByText(
          "You can't select Solana network for Tether USD. We're adding more networks over time.",
        ),
      ).toBeVisible();
    });
    expect(screen.queryByTestId("contacts-add-address-input")).toBeNull();

    await user.press(screen.getByRole("button", { name: "Got it" }));

    await waitFor(() => {
      expect(screen.queryByText("Solana Network isn't supported yet")).toBeNull();
    });

    await user.press(ethereumNetwork);

    await waitFor(() => {
      expect(screen.getByTestId("contacts-add-address-input")).toBeVisible();
    });
  }, 10_000);

  it("should group ineligible assets and networks under a 'Not available yet' section", async () => {
    const { user } = render(<ContactDetailAddressEntryTestApp />, {
      navigationInitialState: contactDetailNavigationState,
      overrideInitialState: withContactsPageReadyState(evmOnlyContactsFeatureFlag),
    });

    await user.press(screen.getByTestId("contacts-detail-add-address"));

    await screen.findByTestId("asset-item-explanation-BTC");
    expect(screen.getByTestId("modular-drawer-unavailable-assets-header")).toBeVisible();

    const assetTickers = getRenderedRowLabels("asset-item");
    expect(assetTickers.indexOf("USDT")).toBeLessThan(assetTickers.indexOf("BTC"));

    await user.press(screen.getByTestId("asset-item-USDT"));

    await screen.findByTestId("network-item-explanation-Solana");
    expect(screen.getByTestId("modular-drawer-unavailable-networks-header")).toBeVisible();

    const networkNames = getRenderedRowLabels("network-item");
    expect(networkNames.indexOf("Ethereum")).toBeLessThan(networkNames.indexOf("Solana"));
  }, 10_000);

  it("should return to currency selection without removing the contact detail route", async () => {
    const { user } = render(<ContactDetailAddressEntryTestApp />, {
      navigationInitialState: contactDetailNavigationState,
      overrideInitialState: withContactsPageReadyState(evmOnlyContactsFeatureFlag),
    });

    await user.press(screen.getByTestId("contacts-detail-add-address"));
    await user.press(screen.getByTestId("contacts-address-entry-select-currency"));
    expect(await screen.findByTestId("contacts-add-address-input")).toBeVisible();

    await user.press(
      within(screen.getByTestId("contacts-add-address-step-frame")).getByTestId(
        "bottom-sheet-header-back-button",
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId("contacts-detail-screen")).toBeVisible();
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

  it("should open the send flow from the address detail sheet", async () => {
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({ ...state, contacts: { contacts: mockPopulatedContacts() } }),
      ),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ben"));
    await user.press(await screen.findByTestId("contacts-detail-address-row-address-ethereum"));
    await user.press(await screen.findByText("Send"));

    expect(mockHandleOpenSendFlow).toHaveBeenCalledWith({
      currencyIds: ["ethereum"],
      recipient: "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
      skipRecipientStep: true,
    });
  });

  it("should open the delete sheet without requiring a device connection", async () => {
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({ ...state, contacts: { contacts: mockPopulatedContacts() } }),
      ),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ben"));
    await user.press(await screen.findByTestId("contacts-detail-address-row-address-ethereum"));
    await user.press(await screen.findByTestId("contacts-address-detail-delete"));

    expect(await screen.findByTestId("contacts-delete-address-confirm")).toBeVisible();
    expect(screen.getByText("Delete address?")).toBeVisible();
    expect(screen.queryByTestId("contacts-edit-signer-confirm")).toBeNull();
  });

  it("should delete an address and close the address detail sheet", async () => {
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({ ...state, contacts: { contacts: mockPopulatedContacts() } }),
      ),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ben"));
    await user.press(await screen.findByTestId("contacts-detail-address-row-address-ethereum"));
    await user.press(await screen.findByTestId("contacts-address-detail-delete"));

    expect(await screen.findByTestId("contacts-delete-address-confirm")).toBeVisible();

    await user.press(screen.getByTestId("contacts-delete-address-confirm"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-delete-address-confirm")).toBeNull();
      expect(screen.queryByTestId("contacts-address-detail-dialog")).toBeNull();
      expect(screen.getByText("1 address")).toBeVisible();
      expect(screen.queryByTestId("contacts-detail-address-row-address-ethereum")).toBeNull();
      expect(screen.getByTestId("contacts-detail-address-row-address-polygon")).toBeVisible();
    });
  });

  it("should open the edit address sheet without asking for the signer first", async () => {
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({ ...state, contacts: { contacts: mockPopulatedContacts() } }),
      ),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ben"));
    await user.press(await screen.findByTestId("contacts-detail-address-row-address-ethereum"));
    await user.press(await screen.findByText("Edit"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-edit-signer-confirm")).toBeNull();
      expect(screen.getByTestId("contacts-rename-address-confirm")).toBeVisible();
      expect(screen.getByTestId("contacts-edit-address-input")).toHaveProp(
        "value",
        "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
      );
    });
  });

  it("should reopen the edit address sheet after closing it", async () => {
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({ ...state, contacts: { contacts: mockPopulatedContacts() } }),
      ),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ben"));
    await user.press(await screen.findByTestId("contacts-detail-address-row-address-ethereum"));
    await user.press(await screen.findByText("Edit"));

    expect(await screen.findByTestId("contacts-rename-address-confirm")).toBeVisible();

    // The address detail sheet stays mounted behind the edit sheet, which is rendered last.
    const closeButtons = screen.getAllByTestId("bottom-sheet-header-close-button");
    await user.press(closeButtons[closeButtons.length - 1]);

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-rename-address-confirm")).toBeNull();
    });

    await user.press(await screen.findByTestId("contacts-detail-address-row-address-ethereum"));
    await user.press(await screen.findByText("Edit"));

    expect(await screen.findByTestId("contacts-rename-address-confirm")).toBeVisible();
  });

  it("should rename an address after applying changes", async () => {
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({ ...state, contacts: { contacts: mockPopulatedContacts() } }),
      ),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ben"));
    await user.press(await screen.findByTestId("contacts-detail-address-row-address-ethereum"));
    await user.press(await screen.findByText("Edit"));
    const renameInput = await screen.findByDisplayValue("Ethereum");
    await user.clear(renameInput);
    await user.type(renameInput, "Exchange wallet");
    await user.press(screen.getByTestId("contacts-rename-address-confirm"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-edit-signer-confirm")).toBeNull();
      expect(screen.queryByTestId("contacts-rename-address-confirm")).toBeNull();
      expect(screen.queryByTestId("contacts-address-detail-dialog")).toBeNull();
      expect(screen.getByText("Exchange wallet")).toBeVisible();
    });
  });

  it("should prefill the saved address and update the address value", async () => {
    const newAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({ ...state, contacts: { contacts: mockPopulatedContacts() } }),
      ),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ben"));
    await user.press(await screen.findByTestId("contacts-detail-address-row-address-ethereum"));
    await user.press(await screen.findByText("Edit"));

    const addressInput = await screen.findByTestId("contacts-edit-address-input");
    expect(addressInput).toHaveProp("value", "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034");

    await user.clear(addressInput);
    await user.type(addressInput, newAddress);

    await waitFor(() => {
      expect(screen.getByTestId("contacts-rename-address-confirm")).toBeEnabled();
    });

    await user.press(screen.getByTestId("contacts-rename-address-confirm"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-edit-signer-confirm")).toBeNull();
      expect(screen.queryByTestId("contacts-rename-address-confirm")).toBeNull();
      expect(screen.queryByTestId("contacts-address-detail-dialog")).toBeNull();
    });

    await user.press(await screen.findByTestId("contacts-detail-address-row-address-ethereum"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-address-detail-dialog")).toBeVisible();
      expect(screen.getByTestId("contacts-address-detail-full-address")).toHaveTextContent(
        newAddress,
      );
    });
  });

  it("should hide delete from the Me contact actions menu", async () => {
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState({
        lwmContacts: { enabled: true, params: { newBadge: false } },
      }),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-me-item"));
    await user.press(await screen.findByTestId("contacts-detail-actions-trigger"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-detail-edit-action")).toBeVisible();
      expect(screen.queryByTestId("contacts-detail-delete-action")).toBeNull();
    });
  });

  it("should rename a saved contact from the actions menu", async () => {
    const contacts = [mockMeContact(), mockContact({ id: "contact-ada", name: "Ada" })];
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({ ...state, contacts: { contacts } }),
      ),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ada"));
    await user.press(await screen.findByTestId("contacts-detail-actions-trigger"));
    await user.press(await screen.findByTestId("contacts-detail-edit-action"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-rename-contact-confirm")).toBeDisabled();
    });

    await user.clear(screen.getByTestId("contacts-rename-contact-name-input"));
    await user.type(screen.getByTestId("contacts-rename-contact-name-input"), "Alice");

    await waitFor(() => {
      expect(screen.getByTestId("contacts-rename-contact-confirm")).toBeEnabled();
    });

    await user.press(screen.getByTestId("contacts-rename-contact-confirm"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-rename-contact-confirm")).toBeNull();
      expect(screen.getByText("Alice")).toBeVisible();
    });
  });

  it("should open the rename contact sheet without asking for the signer first", async () => {
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({ ...state, contacts: { contacts: mockPopulatedContacts() } }),
      ),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ben"));
    await user.press(await screen.findByTestId("contacts-detail-actions-trigger"));
    await user.press(await screen.findByTestId("contacts-detail-edit-action"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-edit-signer-confirm")).toBeNull();
      expect(screen.getByTestId("contacts-rename-contact-confirm")).toBeVisible();
    });
  });

  it("should rename a saved contact after applying changes", async () => {
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({ ...state, contacts: { contacts: mockPopulatedContacts() } }),
      ),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ben"));
    await user.press(await screen.findByTestId("contacts-detail-actions-trigger"));
    await user.press(await screen.findByTestId("contacts-detail-edit-action"));

    const renameInput = await screen.findByTestId("contacts-rename-contact-name-input");
    await user.clear(renameInput);
    await user.type(renameInput, "Benjamin");
    await user.press(screen.getByTestId("contacts-rename-contact-confirm"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-edit-signer-confirm")).toBeNull();
      expect(screen.queryByTestId("contacts-rename-contact-confirm")).toBeNull();
      expect(screen.getByText("Benjamin")).toBeVisible();
    });
  });

  it("should reopen the delete contact confirmation after canceling it", async () => {
    const contacts = [mockMeContact(), mockContact({ id: "contact-ada", name: "Ada" })];
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({ ...state, contacts: { contacts } }),
      ),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ada"));
    await user.press(await screen.findByTestId("contacts-detail-actions-trigger"));
    await user.press(await screen.findByTestId("contacts-detail-delete-action"));

    expect(await screen.findByTestId("contacts-delete-contact-confirm")).toBeVisible();

    await user.press(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-delete-contact-confirm")).toBeNull();
    });

    await user.press(await screen.findByTestId("contacts-detail-actions-trigger"));
    await user.press(await screen.findByTestId("contacts-detail-delete-action"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-delete-contact-confirm")).toBeVisible();
    });
  });

  it("should delete a saved contact and navigate back to the contacts list", async () => {
    const contacts = [mockMeContact(), mockContact({ id: "contact-ada", name: "Ada" })];
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({ ...state, contacts: { contacts } }),
      ),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ada"));
    await user.press(await screen.findByTestId("contacts-detail-actions-trigger"));
    await user.press(await screen.findByTestId("contacts-detail-delete-action"));
    await user.press(await screen.findByTestId("contacts-delete-contact-confirm"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-detail-screen")).toBeNull();
      expect(screen.getByTestId("contacts-screen")).toBeVisible();
      expect(screen.queryByTestId("contacts-saved-contact-contact-ada")).toBeNull();
    });
  });
});
