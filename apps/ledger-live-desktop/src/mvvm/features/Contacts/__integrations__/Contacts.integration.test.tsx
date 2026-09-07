import React from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import type { ContactId } from "@domain/entity-contact";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { resolveEligibleAddressCurrencyIds } from "@features/platform-contacts";
import { isAddressSanctioned } from "@ledgerhq/ledger-wallet-framework/sanction/index";
import {
  mockContact,
  mockMeContact,
  mockPopulatedContacts,
} from "@domain/entity-contact/schema.mock";
import {
  act,
  fireEvent,
  render,
  screen,
  within,
  withFlagOverrides,
  waitFor,
} from "tests/testSetup";
import ContactsScreen, { ContactsButton } from "LLD/features/Contacts";
import { useActivationDrawer } from "LLD/features/LedgerSyncEntryPoints/hooks/useActivationDrawer";
import { useContactsLedgerSyncStatus } from "LLD/features/Contacts/hooks/useContactsLedgerSyncStatus";
import { useContactsViewModel } from "LLD/features/Contacts/screens/Contacts/useContactsViewModel";
import ContextMenuContext from "LLD/features/MyWallet/components/ContextMenuContext";
import { ContextMenu } from "LLD/features/MyWallet/components/ContextMenu";
import { CONTEXT_MENU_VIEW } from "LLD/features/MyWallet/components/ContextMenu/types";
import { openURL } from "~/renderer/linking";

const mockNavigate = jest.fn();
const mockClose = jest.fn();
const mockValidateAddress = jest.fn();
const mockOpenSendFlow = jest.fn();
const mockOpenActivationDrawer = jest.fn();
const meContactId = mockMeContact().id;
const savedContactId = mockContact({ id: "contact-ada" }).id;

jest.mock("react-router", () => ({
  ...jest.requireActual<typeof import("react-router")>("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("LLD/features/Send/hooks/useOpenSendFlow", () => ({
  useOpenSendFlow: () => mockOpenSendFlow,
}));

jest.mock("LLD/features/LedgerSyncEntryPoints/hooks/useActivationDrawer", () => ({
  useActivationDrawer: jest.fn(),
}));

jest.mock("LLD/features/Contacts/hooks/useContactsLedgerSyncStatus", () => ({
  useContactsLedgerSyncStatus: jest.fn(),
}));

const mockedUseActivationDrawer = jest.mocked(useActivationDrawer);
const mockedContactsLedgerSyncStatus = jest.mocked(useContactsLedgerSyncStatus);

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
  resetStore: jest.fn(),
}));

// Device intents resolve without a device so these tests cover the dialog flows only.
// The executor wiring is covered by Contacts.deviceIntents.integration.test.tsx.
jest.mock("@features/platform-contacts/device");

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  ...jest.requireActual<typeof import("@ledgerhq/live-common/bridge/index")>(
    "@ledgerhq/live-common/bridge/index",
  ),
  getAccountBridgeByFamily: jest.fn().mockResolvedValue({
    validateAddress: (...args: unknown[]) => mockValidateAddress(...args),
  }),
}));

jest.mock("@ledgerhq/ledger-wallet-framework/sanction/index", () => ({
  isAddressSanctioned: jest.fn(),
}));

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const contextMenuValue = {
  close: mockClose,
  view: CONTEXT_MENU_VIEW.myWallet,
  direction: "forward" as const,
  navigateTo: jest.fn(),
  goBack: jest.fn(),
};

function renderContactsButton(initialState: ReturnType<typeof withFlagOverrides>) {
  return render(
    <ContextMenuContext.Provider value={contextMenuValue}>
      <ContactsButton />
    </ContextMenuContext.Provider>,
    { initialState },
  );
}

function contactsPageInitialState(extra: Record<string, unknown> = {}) {
  return {
    ...withFlagOverrides({
      lwdContacts: { enabled: true, params: { newBadge: false } },
    }),
    settings: {
      hasDismissedContactsFeatureIntroduction: true,
    },
    ...extra,
  };
}

const populatedContactsPageState = { contacts: { contacts: mockPopulatedContacts() } };

function renderContactsScreen(extraInitialState: Record<string, unknown> = {}) {
  return render(
    <MemoryRouter initialEntries={["/contacts"]}>
      <Routes>
        <Route path="/contacts" element={<ContactsScreen />} />
      </Routes>
    </MemoryRouter>,
    {
      skipRouter: true,
      initialState: contactsPageInitialState(extraInitialState),
    },
  );
}

function ContactsViewModelProbe({
  contactId,
  contactType,
}: Readonly<{
  contactId: ContactId;
  contactType: "me" | "saved";
}>) {
  const viewModel = useContactsViewModel();
  const stateLabel =
    viewModel.addAddressFlowState.status === "closed"
      ? "closed"
      : [
          viewModel.addAddressFlowState.status,
          viewModel.addAddressFlowState.selectedContactId,
          "selectedCurrencyId" in viewModel.addAddressFlowState
            ? viewModel.addAddressFlowState.selectedCurrencyId
            : undefined,
        ]
          .filter(Boolean)
          .join(":");

  return (
    <>
      <div data-testid="contacts-add-address-flow-state">{stateLabel}</div>
      <button
        type="button"
        onClick={() =>
          contactType === "me" ? viewModel.onOpenMe(contactId) : viewModel.onOpenContact(contactId)
        }
      >
        Open contact
      </button>
      <button type="button" onClick={viewModel.detail?.onAddAddress} disabled={!viewModel.detail}>
        Start Add Address
      </button>
      <button type="button" onClick={viewModel.addAddressFlowDialog.onContinueFromReview}>
        Continue address review
      </button>
    </>
  );
}

describe("Contacts integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedContactsLedgerSyncStatus.mockReturnValue("ready");
    mockedUseActivationDrawer.mockReturnValue({
      openDrawer: mockOpenActivationDrawer,
      closeDrawer: jest.fn(),
    });
    mockValidateAddress.mockResolvedValue(true);
    jest.mocked(isAddressSanctioned).mockResolvedValue(false);
  });

  it("should not render the Contacts button when lwdContacts is disabled", () => {
    renderContactsButton(
      withFlagOverrides({
        lwdContacts: { enabled: false, params: { newBadge: false } },
      }),
    );

    expect(screen.queryByTestId("my-wallet-contacts-button")).not.toBeInTheDocument();
  });

  it("should render the Contacts button without a New badge when enabled and newBadge is false", () => {
    renderContactsButton(
      withFlagOverrides({
        lwdContacts: { enabled: true, params: { newBadge: false } },
      }),
    );

    expect(screen.getByTestId("my-wallet-contacts-button")).toBeVisible();
    expect(screen.queryByTestId("contacts-button-new-badge")).not.toBeInTheDocument();
  });

  it("should render the Contacts button with a New badge when enabled and newBadge is true", () => {
    renderContactsButton(
      withFlagOverrides({
        lwdContacts: { enabled: true, params: { newBadge: true } },
      }),
    );

    expect(screen.getByTestId("my-wallet-contacts-button")).toBeVisible();
    expect(screen.getByTestId("contacts-button-new-badge")).toBeVisible();
  });

  it("should show the Contacts button in My Wallet when the feature flag is enabled", async () => {
    const { user } = render(<ContextMenu />, {
      initialState: withFlagOverrides({
        lwdContacts: { enabled: true, params: { newBadge: false } },
      }),
    });

    await user.click(screen.getByRole("button", { name: "My Wallet" }));

    await waitFor(() => {
      expect(screen.getByTestId("my-wallet-contacts-button")).toBeVisible();
    });
  });

  it("should redirect away from the Contacts page when lwdContacts is disabled", () => {
    render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <Routes>
          <Route path="/" element={<div data-testid="home-page" />} />
          <Route path="/contacts" element={<ContactsScreen />} />
        </Routes>
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: withFlagOverrides({
          lwdContacts: { enabled: false, params: { newBadge: false } },
        }),
      },
    );

    expect(screen.getByTestId("home-page")).toBeVisible();
    expect(screen.queryByTestId("contacts-page")).not.toBeInTheDocument();
  });

  it("should render the empty Contacts list when lwdContacts is enabled", async () => {
    renderContactsScreen();

    expect(screen.getByTestId("contacts-page")).toBeVisible();
    expect(screen.getByTestId("contacts-page-header")).toBeVisible();
    expect(screen.getByTestId("contacts-list-pane")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-pane")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-screen")).toBeVisible();
    expect(screen.queryByTestId("contacts-ledger-sync-list-loading")).not.toBeInTheDocument();
    expect(screen.queryByTestId("contacts-ledger-sync-detail-loading")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contacts" })).toBeVisible();
    expect(screen.getByPlaceholderText("Search contact")).toBeVisible();
    expect(screen.getByTestId("contacts-add-contact")).toBeVisible();
    expect(screen.getByTestId("contacts-add-contact-header")).toBeVisible();

    await waitFor(() => {
      expect(screen.getByTestId("contacts-me-row")).toHaveTextContent("Me");
      expect(screen.getByTestId("contacts-me-row")).toHaveTextContent("0 address");
    });
  });

  it("should render the default Me contact when the persisted Contacts state has none", () => {
    renderContactsScreen({ contacts: { contacts: [] } });

    expect(screen.getByTestId("contacts-page")).toBeVisible();
    expect(screen.getByTestId("contacts-me-row")).toHaveTextContent("Me");
  });

  it("should render saved contacts in alphabetical order when contacts exist", () => {
    renderContactsScreen(populatedContactsPageState);

    expect(screen.getByTestId("contacts-page")).toBeVisible();
    expect(screen.getByTestId("contacts-add-contact")).toBeVisible();
    expect(screen.getByTestId("contacts-add-contact-header")).toBeVisible();
    expect(screen.getByTestId("contacts-section-A")).toBeVisible();
    expect(screen.getByTestId("contacts-section-B")).toBeVisible();
    expect(screen.getByTestId("contacts-section-C")).toBeVisible();
    expect(screen.getByTestId("contacts-section-D")).toBeVisible();
    expect(screen.getByTestId("contacts-section-O")).toBeVisible();

    expect(screen.getByTestId("contacts-me-row")).toHaveTextContent("Me");
    expect(screen.getByTestId("contacts-me-row")).toHaveTextContent("3 addresses");
    expect(screen.getByTestId("contacts-saved-row-contact-ada")).toHaveTextContent("Ada");
    expect(screen.getByTestId("contacts-saved-row-contact-ben")).toHaveTextContent("Ben");
    expect(screen.getByTestId("contacts-saved-row-contact-charlie")).toHaveTextContent("Charlie");
    expect(screen.getByTestId("contacts-saved-row-contact-diana")).toHaveTextContent("Diana");
    expect(screen.getByTestId("contacts-saved-row-contact-olive")).toHaveTextContent("Olive");
  });

  it("should save a contact from the add-contact CTA", async () => {
    const { user } = renderContactsScreen();

    await user.click(screen.getByTestId("contacts-add-contact"));

    expect(screen.getByTestId("contacts-add-contact-dialog")).toBeVisible();
    expect(screen.getByTestId("contacts-add-contact-save")).toBeDisabled();

    const input = screen.getByTestId("contacts-add-contact-name-input");

    await user.type(input, "Coinbase 1");

    expect(screen.getByTestId("contacts-add-contact-save")).toBeEnabled();

    await user.click(screen.getByTestId("contacts-add-contact-save"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-add-contact-dialog")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("contacts-detail-name")).toHaveTextContent("Coinbase 1");
  });

  it("should open Ledger Sync activation instead of adding a contact while sync is inactive", async () => {
    mockedContactsLedgerSyncStatus.mockReturnValue("inactive");
    const { user } = renderContactsScreen();

    await user.click(screen.getByTestId("contacts-add-contact"));

    expect(screen.queryByTestId("contacts-add-contact-dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Turn on Ledger Sync" }));

    expect(mockOpenActivationDrawer).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should block a duplicate contact name and allow a unique replacement", async () => {
    const me = mockMeContact();
    const ada = mockContact({ id: "contact-ada", name: "Ada" });
    const { user } = renderContactsScreen({ contacts: { contacts: [me, ada] } });

    await user.click(screen.getByTestId("contacts-add-contact"));
    const input = screen.getByTestId("contacts-add-contact-name-input");

    fireEvent.change(input, { target: { value: " ada " } });

    expect(screen.getByText("This contact name is already in use.")).toBeVisible();
    expect(screen.getByTestId("contacts-add-contact-save")).toBeDisabled();

    fireEvent.change(input, { target: { value: "Ben" } });

    expect(screen.queryByText("This contact name is already in use.")).not.toBeInTheDocument();
    expect(screen.getByTestId("contacts-add-contact-save")).toBeEnabled();
  });

  it("should filter saved contacts when searching", async () => {
    const { user } = renderContactsScreen(populatedContactsPageState);

    await user.type(screen.getByTestId("contacts-list-search"), "Ben");

    expect(screen.getByTestId("contacts-saved-row-contact-ben")).toBeVisible();
    expect(screen.queryByTestId("contacts-saved-row-contact-ada")).not.toBeInTheDocument();
    expect(screen.queryByTestId("contacts-saved-row-contact-olive")).not.toBeInTheDocument();
  });

  it("should render the no-results state when the search query has no match", async () => {
    const { user } = renderContactsScreen(populatedContactsPageState);

    await user.type(screen.getByTestId("contacts-list-search"), "unknown");

    expect(screen.getByTestId("contacts-search-no-results")).toBeVisible();
    expect(screen.getByText("No contact found")).toBeVisible();
    expect(screen.queryByTestId("contacts-saved-row-contact-ben")).not.toBeInTheDocument();
    expect(screen.queryByTestId("contacts-add-contact")).not.toBeInTheDocument();
    expect(screen.queryByTestId("contacts-add-contact-header")).not.toBeInTheDocument();
  });

  it("should show the one-time feature introduction on first visit and complete it from Explore now", async () => {
    const { user, store } = renderContactsScreen({
      settings: { hasDismissedContactsFeatureIntroduction: false },
    });

    expect(screen.getByTestId("contacts-feature-introduction-dialog")).toBeVisible();

    await user.click(screen.getByTestId("contacts-feature-introduction-primary"));

    expect(store.getState().settings.hasDismissedContactsFeatureIntroduction).toBe(true);
    expect(screen.queryByTestId("contacts-feature-introduction-dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("contacts-list")).toBeVisible();
  });

  it("should render populated Me detail on load when populated contacts are persisted", () => {
    renderContactsScreen(populatedContactsPageState);

    expect(screen.getByTestId("contacts-detail-name")).toHaveTextContent("Me");
    expect(
      within(screen.getByTestId("contacts-detail-screen")).getByText("3 addresses"),
    ).toBeVisible();
    expect(screen.getByTestId("contacts-detail-address-list")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-network-group-arbitrum")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-network-group-base")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-network-group-ethereum")).toBeVisible();
    expect(
      screen.getByTestId("contacts-detail-address-row-address-me-arbitrum-usdc"),
    ).toBeVisible();
    expect(screen.queryByTestId("contacts-detail-empty-state")).not.toBeInTheDocument();
  });

  it("should render the default Me detail state on load", () => {
    renderContactsScreen();

    expect(screen.getByTestId("contacts-detail-screen")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-me-avatar")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-name")).toHaveTextContent("Me");
    expect(screen.getByText("Add external address")).toBeVisible();
    expect(screen.getByText("No saved addresses for you")).toBeVisible();
  });

  it("should render the Me empty detail state when Me is selected after another contact", async () => {
    const { user } = renderContactsScreen(populatedContactsPageState);

    await user.click(screen.getByTestId("contacts-saved-row-contact-ada"));
    await user.click(screen.getByTestId("contacts-me-row"));

    expect(screen.getByTestId("contacts-detail-name")).toHaveTextContent("Me");
    expect(screen.queryByText("No saved addresses for Ada")).not.toBeInTheDocument();
  });

  it("should render a saved contact empty detail state when an empty contact is selected", async () => {
    const { user } = renderContactsScreen(populatedContactsPageState);

    await user.click(screen.getByTestId("contacts-saved-row-contact-ada"));

    expect(screen.getByTestId("contacts-detail-screen")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-avatar")).toBeVisible();
    expect(screen.getByText("No saved addresses for Ada")).toBeVisible();
    expect(
      screen.getByText("Save their wallet addresses to send to them by name next time"),
    ).toBeVisible();
    expect(screen.getByTestId("contacts-detail-add-address")).toBeVisible();
  });

  it("should open MAD from the real Add Address CTA with the eligible selectable network ids", async () => {
    const { store, user } = renderContactsScreen();

    await user.click(screen.getByTestId("contacts-me-row"));
    await user.click(screen.getByTestId("contacts-detail-add-address"));

    expect(store.getState().modularDialog.isOpen).toBe(true);
    expect(store.getState().modularDialog.dialogParams?.selectableNetworkIds).toEqual(
      resolveEligibleAddressCurrencyIds(["evm"]),
    );
    expect(store.getState().modularDialog.dialogParams?.presentation).toBe("embedded");
    expect(store.getState().modularDialog.dialogParams?.onAccountSelected).toBeUndefined();
  });

  it("should keep one Contacts dialog mounted from currency selection to address entry", async () => {
    const { store, user } = renderContactsScreen();

    await user.click(screen.getByTestId("contacts-me-row"));
    await user.click(screen.getByTestId("contacts-detail-add-address"));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeVisible();

    await waitFor(() => {
      expect(screen.getByTestId("asset-selector-list-container")).toBeVisible();
    });

    const assetList = screen.getByTestId("asset-selector-list-container");
    expect(dialog).toHaveClass("h-560");
    expect(screen.getByTestId("modular-dialog-screen-ASSET_SELECTION")).toHaveClass("flex-1");
    expect(assetList).toHaveClass("h-auto");
    expect(assetList).toHaveClass("min-h-0");
    expect(assetList).toHaveClass("flex-1");
    expect(dialog.querySelector('[data-slot="dialog-body"]')).toHaveClass("pb-0");
    expect(dialog.querySelector('[data-slot="dialog-body"]')).toHaveClass("px-16");

    act(() => {
      store
        .getState()
        .modularDialog.dialogParams?.onAssetSelected?.(getCryptoCurrencyById("ethereum"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("contacts-add-address-input")).toBeVisible();
    });
    expect(screen.getByRole("dialog")).toBe(dialog);
    const confirmationButton = screen.getByTestId("contacts-add-address-confirm");
    expect(confirmationButton).toBeDisabled();
    expect(confirmationButton.querySelector("svg")).not.toBeNull();
    expect(dialog.querySelector('[data-slot="dialog-body"]')).toHaveClass("!mb-0");
    expect(dialog.querySelector('[data-slot="dialog-body"]')).toHaveClass("pb-24");
    expect(dialog.querySelector('[data-slot="dialog-body"]')).toHaveClass("px-24");
  });

  it("should render the address and its prefilled name together before review", async () => {
    const { store, user } = render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <Routes>
          <Route path="/contacts" element={<ContactsScreen />} />
        </Routes>
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: contactsPageInitialState(),
      },
    );

    await user.click(screen.getByTestId("contacts-me-row"));
    await user.click(screen.getByTestId("contacts-detail-add-address"));

    const dialog = screen.getByRole("dialog");
    act(() => {
      store
        .getState()
        .modularDialog.dialogParams?.onAssetSelected?.(getCryptoCurrencyById("ethereum"));
    });

    const addressInput = await screen.findByTestId("contacts-add-address-input");
    const addressNameInput = screen.getByTestId("contacts-add-address-name-input");
    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(addressNameInput).toHaveValue("Ethereum");
    expect(addressNameInput).toHaveAttribute("maxlength", "32");
    expect(screen.getByTestId("contacts-add-address-confirm")).toBeDisabled();

    const namingDisclaimer = screen.getByRole("button", {
      name: "Address name information",
    });
    await user.hover(namingDisclaimer);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "This name appears on your Ledger device when you send to this address. Give it a name that makes it easy to find.",
    );
    expect(addressNameInput).toHaveValue("Ethereum");

    fireEvent.change(addressInput, {
      target: { value: "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034" },
    });

    const confirmationButton = screen.getByTestId("contacts-add-address-confirm");
    await waitFor(() => expect(confirmationButton).toBeEnabled());

    await user.clear(addressNameInput);
    await user.type(addressNameInput, "Ethereum 💎");

    expect(screen.getByText("Special characters are not allowed.")).toBeVisible();
    expect(confirmationButton).toBeDisabled();

    await user.clear(addressNameInput);
    await user.type(addressNameInput, "Exchange");
    await user.click(confirmationButton);

    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(screen.getByTestId("contacts-add-address-review")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Go back" }));
    expect(screen.getByTestId("contacts-add-address-input")).toBeVisible();
    expect(screen.getByTestId("contacts-add-address-name-input")).toHaveValue("Exchange");

    await user.click(screen.getByTestId("contacts-add-address-confirm"));
    await user.click(screen.getByTestId("contacts-add-address-review-continue"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-add-address-success")).toBeVisible();
    });

    await user.click(screen.getByTestId("contacts-add-address-success-continue"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-add-address-success")).not.toBeInTheDocument();
      expect(
        within(screen.getByTestId("contacts-detail-screen")).getByText("1 address"),
      ).toBeVisible();
      expect(screen.getByTestId("contacts-detail-network-group-ethereum")).toBeVisible();
      expect(
        within(screen.getByTestId("contacts-detail-screen")).getByText("Exchange"),
      ).toBeVisible();
    });
  });

  it("should reopen currency selection when going back from address entry", async () => {
    const { store, user } = renderContactsScreen();

    await user.click(screen.getByTestId("contacts-me-row"));
    await user.click(screen.getByTestId("contacts-detail-add-address"));
    act(() => {
      store
        .getState()
        .modularDialog.dialogParams?.onAssetSelected?.(getCryptoCurrencyById("ethereum"));
    });

    await screen.findByTestId("contacts-add-address-input");
    await user.click(screen.getByRole("button", { name: "Go back" }));

    await waitFor(() => {
      expect(store.getState().modularDialog.isOpen).toBe(true);
    });
  });

  it("should ignore review continuation when the address flow is closed", async () => {
    const { user } = render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <ContactsViewModelProbe contactId={meContactId} contactType="me" />
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: contactsPageInitialState(),
      },
    );

    await user.click(screen.getByRole("button", { name: "Continue address review" }));

    expect(screen.getByTestId("contacts-add-address-flow-state")).toHaveTextContent("closed");
  });

  it("should render an invalid-format helper and block address confirmation", async () => {
    mockValidateAddress.mockResolvedValue(false);
    const { store, user } = renderContactsScreen();

    await user.click(screen.getByTestId("contacts-me-row"));
    await user.click(screen.getByTestId("contacts-detail-add-address"));
    act(() => {
      store
        .getState()
        .modularDialog.dialogParams?.onAssetSelected?.(getCryptoCurrencyById("ethereum"));
    });

    const addressInput = await screen.findByTestId("contacts-add-address-input");
    fireEvent.change(addressInput, {
      target: { value: "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034" },
    });

    await waitFor(() => {
      expect(screen.getByText("Incorrect address format.")).toBeVisible();
      expect(screen.getByTestId("contacts-add-address-confirm")).toBeDisabled();
    });
    expect(screen.queryByTestId("contacts-sanctioned-address-banner")).not.toBeInTheDocument();
  });

  it("should render sanctioned feedback, block confirmation, and open the Help Center", async () => {
    jest.mocked(isAddressSanctioned).mockResolvedValue(true);
    const { store, user } = renderContactsScreen();

    await user.click(screen.getByTestId("contacts-me-row"));
    await user.click(screen.getByTestId("contacts-detail-add-address"));
    act(() => {
      store
        .getState()
        .modularDialog.dialogParams?.onAssetSelected?.(getCryptoCurrencyById("ethereum"));
    });

    const addressInput = await screen.findByTestId("contacts-add-address-input");
    fireEvent.change(addressInput, {
      target: { value: "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034" },
    });

    await waitFor(() => {
      expect(screen.getByText("Sanctioned address.")).toBeVisible();
      expect(screen.getByTestId("contacts-sanctioned-address-banner")).toBeVisible();
      expect(
        screen.getByText(
          "This wallet address is sanctioned by international laws and regulations.",
        ),
      ).toBeVisible();
      expect(screen.getByTestId("contacts-add-address-confirm")).toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: "Learn more" }));

    expect(openURL).toHaveBeenCalledTimes(1);
  });

  it("should expose the Add Address session started for Me", async () => {
    const { user } = render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <ContactsViewModelProbe contactId={meContactId} contactType="me" />
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: contactsPageInitialState(),
      },
    );

    expect(screen.getByTestId("contacts-add-address-flow-state")).toHaveTextContent("closed");

    await user.click(screen.getByRole("button", { name: "Open contact" }));

    expect(screen.getByTestId("contacts-add-address-flow-state")).toHaveTextContent("closed");

    await user.click(screen.getByRole("button", { name: "Start Add Address" }));

    expect(screen.getByTestId("contacts-add-address-flow-state")).toHaveTextContent(
      "selectingCurrency:contact-me",
    );
  });

  it("should keep the Add Address session closed while Ledger Sync is inactive", async () => {
    mockedContactsLedgerSyncStatus.mockReturnValue("inactive");
    const { user } = render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <ContactsViewModelProbe contactId={meContactId} contactType="me" />
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: contactsPageInitialState(),
      },
    );

    await user.click(screen.getByRole("button", { name: "Open contact" }));
    await user.click(screen.getByRole("button", { name: "Start Add Address" }));

    expect(screen.getByTestId("contacts-add-address-flow-state")).toHaveTextContent("closed");
  });

  it("should expose the Add Address session started for a saved contact", async () => {
    const { user } = render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <ContactsViewModelProbe contactId={savedContactId} contactType="saved" />
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: contactsPageInitialState({ contacts: { contacts: mockPopulatedContacts() } }),
      },
    );

    await user.click(screen.getByRole("button", { name: "Open contact" }));

    expect(screen.getByTestId("contacts-add-address-flow-state")).toHaveTextContent("closed");

    await user.click(screen.getByRole("button", { name: "Start Add Address" }));

    expect(screen.getByTestId("contacts-add-address-flow-state")).toHaveTextContent(
      "selectingCurrency:contact-ada",
    );
  });

  it("should enter the address step with the exact selected contact and currency", async () => {
    const { store, user } = render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <ContactsViewModelProbe contactId={savedContactId} contactType="saved" />
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: contactsPageInitialState({ contacts: { contacts: mockPopulatedContacts() } }),
      },
    );

    await user.click(screen.getByRole("button", { name: "Open contact" }));
    await user.click(screen.getByRole("button", { name: "Start Add Address" }));

    act(() => {
      store
        .getState()
        .modularDialog.dialogParams?.onAssetSelected?.(getCryptoCurrencyById("ethereum"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("contacts-add-address-flow-state")).toHaveTextContent(
        "enteringAddress:contact-ada:ethereum",
      );
    });
    expect(store.getState().modularDialog.isOpen).toBe(false);
  });

  it("should close the Add Address session when MAD is cancelled", async () => {
    const { store, user } = render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <ContactsViewModelProbe contactId={meContactId} contactType="me" />
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: contactsPageInitialState(),
      },
    );

    await user.click(screen.getByRole("button", { name: "Open contact" }));
    await user.click(screen.getByRole("button", { name: "Start Add Address" }));

    act(() => {
      store.getState().modularDialog.dialogParams?.onClose?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId("contacts-add-address-flow-state")).toHaveTextContent("closed");
    });
    expect(store.getState().modularDialog.isOpen).toBe(false);
  });

  it("should keep the Add Address session closed when no network is eligible", async () => {
    const { store, user } = render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <ContactsViewModelProbe contactId={meContactId} contactType="me" />
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: {
          ...contactsPageInitialState(),
          ...withFlagOverrides({
            lwdContacts: {
              enabled: true,
              params: { newBadge: false, eligibleAddressFamilies: ["unknown"] },
            },
          }),
        },
      },
    );

    await user.click(screen.getByRole("button", { name: "Open contact" }));
    await user.click(screen.getByRole("button", { name: "Start Add Address" }));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-add-address-flow-state")).toHaveTextContent("closed");
    });
    expect(store.getState().modularDialog.isOpen).toBe(false);
  });

  it("should render populated contact detail when a contact with addresses is selected", async () => {
    const { user } = renderContactsScreen(populatedContactsPageState);

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));

    const detailScreen = screen.getByTestId("contacts-detail-screen");
    expect(detailScreen).toBeVisible();
    expect(within(detailScreen).getByText("2 addresses")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-detail-address-list")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-detail-network-group-ethereum")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-detail-network-group-polygon")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-detail-address-row-address-ethereum")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-detail-address-row-address-polygon")).toBeInTheDocument();
  });

  it("should open the address detail dialog when an address row is clicked", async () => {
    const { user } = renderContactsScreen(populatedContactsPageState);

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));
    await user.click(screen.getByTestId("contacts-detail-address-row-address-ethereum"));

    expect(screen.getByTestId("contacts-address-detail-dialog")).toBeVisible();
    expect(screen.getByTestId("contacts-address-detail-full-address")).toHaveTextContent(
      "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
    );
  });

  it("should close the address detail dialog when switching contacts", async () => {
    const { user } = renderContactsScreen(populatedContactsPageState);

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));
    await user.click(screen.getByTestId("contacts-detail-address-row-address-ethereum"));

    expect(screen.getByTestId("contacts-address-detail-dialog")).toBeVisible();

    await user.click(screen.getByTestId("contacts-saved-row-contact-ada"));

    expect(screen.queryByTestId("contacts-address-detail-dialog")).not.toBeInTheDocument();
  });

  it("should switch populated detail when selecting another contact with addresses", async () => {
    const { user } = renderContactsScreen(populatedContactsPageState);

    await user.click(screen.getByTestId("contacts-saved-row-contact-ada"));
    expect(screen.getByTestId("contacts-detail-screen")).toBeVisible();
    expect(screen.getByText("No saved addresses for Ada")).toBeInTheDocument();

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));

    const detailScreen = screen.getByTestId("contacts-detail-screen");
    expect(detailScreen).toBeVisible();
    expect(within(detailScreen).getByText("2 addresses")).toBeInTheDocument();
    expect(screen.queryByText("No saved addresses for Ada")).not.toBeInTheDocument();
  });

  it("should render edit action for Me and edit/delete actions for saved contacts", async () => {
    const { user } = renderContactsScreen(populatedContactsPageState);

    expect(screen.getByTestId("contacts-detail-edit-action")).toBeVisible();
    expect(screen.queryByTestId("contacts-detail-delete-action")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("contacts-saved-row-contact-ada"));

    expect(screen.getByTestId("contacts-detail-edit-action")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-delete-action")).toBeVisible();
  });

  it("should rename a saved contact from the edit dialog", async () => {
    const { user } = renderContactsScreen(populatedContactsPageState);

    await user.click(screen.getByTestId("contacts-saved-row-contact-ada"));
    await user.click(screen.getByTestId("contacts-detail-edit-action"));

    expect(screen.getByTestId("contacts-rename-contact-dialog")).toBeVisible();
    expect(screen.getByTestId("contacts-rename-contact-confirm")).toBeDisabled();

    fireEvent.change(screen.getByTestId("contacts-rename-contact-name-input"), {
      target: { value: "Alice" },
    });

    expect(screen.getByTestId("contacts-rename-contact-confirm")).toBeEnabled();

    await user.click(screen.getByTestId("contacts-rename-contact-confirm"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-rename-contact-dialog")).not.toBeInTheDocument();
      expect(screen.getByTestId("contacts-saved-row-contact-ada")).toHaveTextContent("Alice");
      expect(screen.getByTestId("contacts-detail-name")).toHaveTextContent("Alice");
    });
  });

  it("should ask for the signer only after saving a contact with addresses", async () => {
    const { user } = renderContactsScreen(populatedContactsPageState);

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));
    await user.click(screen.getByTestId("contacts-detail-edit-action"));

    expect(screen.getByTestId("contacts-rename-contact-dialog")).toBeVisible();
    expect(screen.queryByTestId("contacts-edit-signer-dialog")).not.toBeInTheDocument();

    const nameInput = screen.getByTestId("contacts-rename-contact-name-input");
    await user.clear(nameInput);
    await user.type(nameInput, "Benjamin");
    await user.click(screen.getByTestId("contacts-rename-contact-confirm"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-edit-signer-dialog")).toBeVisible();
    });
    expect(screen.getByTestId("contacts-saved-row-contact-ben")).toHaveTextContent("Ben");

    await user.click(screen.getByTestId("contacts-edit-signer-confirm"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-edit-signer-dialog")).not.toBeInTheDocument();
      expect(screen.queryByTestId("contacts-rename-contact-dialog")).not.toBeInTheDocument();
      expect(screen.getByTestId("contacts-saved-row-contact-ben")).toHaveTextContent("Benjamin");
    });
  });

  it("should delete a saved contact and return to the Me detail pane", async () => {
    const { user } = renderContactsScreen(populatedContactsPageState);

    await user.click(screen.getByTestId("contacts-saved-row-contact-ada"));
    await user.click(screen.getByTestId("contacts-detail-delete-action"));

    expect(screen.getByTestId("contacts-delete-contact-dialog")).toBeVisible();

    await user.click(screen.getByTestId("contacts-delete-contact-confirm"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-delete-contact-dialog")).not.toBeInTheDocument();
      expect(screen.queryByTestId("contacts-saved-row-contact-ada")).not.toBeInTheDocument();
      expect(screen.getByTestId("contacts-detail-name")).toHaveTextContent("Me");
    });
  });

  it("should open the send flow from the address detail dialog", async () => {
    const { user } = renderContactsScreen(populatedContactsPageState);

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));
    await user.click(screen.getByTestId("contacts-detail-address-row-address-ethereum"));
    await user.click(screen.getByTestId("contacts-address-detail-send"));

    expect(mockOpenSendFlow).toHaveBeenCalledWith({
      currencyIds: ["ethereum"],
      recipient: "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
      skipRecipientStep: true,
    });
    expect(screen.queryByTestId("contacts-address-detail-dialog")).not.toBeInTheDocument();
  });

  it("should open the delete dialog without requiring a device connection", async () => {
    const { user } = renderContactsScreen(populatedContactsPageState);

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));
    await user.click(screen.getByTestId("contacts-detail-address-row-address-ethereum"));
    await user.click(screen.getByTestId("contacts-address-detail-delete"));

    expect(screen.queryByTestId("contacts-address-detail-dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("contacts-delete-address-dialog")).toBeVisible();
    expect(screen.queryByTestId("contacts-edit-signer-dialog")).not.toBeInTheDocument();
  });

  it("should delete an address and close the address detail dialog", async () => {
    const { user } = renderContactsScreen(populatedContactsPageState);

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));
    await user.click(screen.getByTestId("contacts-detail-address-row-address-ethereum"));
    await user.click(screen.getByTestId("contacts-address-detail-delete"));

    expect(screen.getByTestId("contacts-delete-address-dialog")).toBeVisible();

    await user.click(screen.getByTestId("contacts-delete-address-confirm"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-delete-address-dialog")).not.toBeInTheDocument();
      expect(screen.queryByTestId("contacts-address-detail-dialog")).not.toBeInTheDocument();
    });

    const detailScreen = screen.getByTestId("contacts-detail-screen");
    expect(within(detailScreen).getByText("1 address")).toBeInTheDocument();
    expect(
      screen.queryByTestId("contacts-detail-address-row-address-ethereum"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("contacts-detail-address-row-address-polygon")).toBeInTheDocument();
  });

  it("should open the rename address dialog without asking for the signer first", async () => {
    const { user } = renderContactsScreen(populatedContactsPageState);

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));
    await user.click(screen.getByTestId("contacts-detail-address-row-address-ethereum"));

    await user.click(screen.getByTestId("contacts-address-detail-edit"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-address-detail-dialog")).not.toBeInTheDocument();
      expect(screen.queryByTestId("contacts-edit-signer-dialog")).not.toBeInTheDocument();
      expect(screen.getByTestId("contacts-rename-address-dialog")).toBeVisible();
      expect(screen.getByTestId("contacts-edit-address-input")).toHaveValue(
        "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
      );
    });
  });

  it("should rename an address and close the edit dialog", async () => {
    const { user } = renderContactsScreen(populatedContactsPageState);

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));
    await user.click(screen.getByTestId("contacts-detail-address-row-address-ethereum"));

    await user.click(screen.getByTestId("contacts-address-detail-edit"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-rename-address-dialog")).toBeVisible();
    });

    fireEvent.change(screen.getByTestId("contacts-rename-address-input"), {
      target: { value: "Main ETH" },
    });
    await user.click(screen.getByTestId("contacts-rename-address-confirm"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-edit-signer-dialog")).toBeVisible();
    });

    await user.click(screen.getByTestId("contacts-edit-signer-confirm"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-rename-address-dialog")).not.toBeInTheDocument();
      expect(screen.queryByTestId("contacts-address-detail-dialog")).not.toBeInTheDocument();
      expect(screen.getByTestId("contacts-detail-address-row-address-ethereum")).toHaveTextContent(
        "Main ETH",
      );
    });
  });

  it("should update an address value and close the edit dialog", async () => {
    const newAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
    const { user } = renderContactsScreen(populatedContactsPageState);

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));
    await user.click(screen.getByTestId("contacts-detail-address-row-address-ethereum"));

    await user.click(screen.getByTestId("contacts-address-detail-edit"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-rename-address-dialog")).toBeVisible();
    });

    fireEvent.change(screen.getByTestId("contacts-edit-address-input"), {
      target: { value: newAddress },
    });

    await waitFor(() => {
      expect(screen.getByTestId("contacts-rename-address-confirm")).not.toBeDisabled();
    });

    await user.click(screen.getByTestId("contacts-rename-address-confirm"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-edit-signer-dialog")).toBeVisible();
    });

    await user.click(screen.getByTestId("contacts-edit-signer-confirm"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-rename-address-dialog")).not.toBeInTheDocument();
      expect(screen.queryByTestId("contacts-address-detail-dialog")).not.toBeInTheDocument();
    });

    await user.click(screen.getByTestId("contacts-detail-address-row-address-ethereum"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-address-detail-dialog")).toBeVisible();
      expect(screen.getByTestId("contacts-address-detail-dialog")).toHaveTextContent(newAddress);
    });
  });
});
