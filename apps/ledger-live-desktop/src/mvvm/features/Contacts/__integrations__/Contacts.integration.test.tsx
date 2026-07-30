import React from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import type { ContactId } from "@domain/entity-contact";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { resolveEligibleAddressCurrencyIds } from "@features/flow-contacts";
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
import { useContactsViewModel } from "LLD/features/Contacts/screens/Contacts/useContactsViewModel";
import ContextMenuContext from "LLD/features/MyWallet/components/ContextMenuContext";
import { ContextMenu } from "LLD/features/MyWallet/components/ContextMenu";
import { CONTEXT_MENU_VIEW } from "LLD/features/MyWallet/components/ContextMenu/types";

const mockNavigate = jest.fn();
const mockClose = jest.fn();
const meContactId = mockMeContact().id;
const savedContactId = mockContact({ id: "contact-ada" }).id;

jest.mock("react-router", () => ({
  ...jest.requireActual<typeof import("react-router")>("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
  resetStore: jest.fn(),
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
    </>
  );
}

describe("Contacts integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    render(
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
    render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <Routes>
          <Route path="/contacts" element={<ContactsScreen />} />
        </Routes>
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: contactsPageInitialState({ contacts: { contacts: [] } }),
      },
    );

    expect(screen.getByTestId("contacts-page")).toBeVisible();
    expect(screen.getByTestId("contacts-me-row")).toHaveTextContent("Me");
  });

  it("should render saved contacts in alphabetical order when contacts exist", () => {
    render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <Routes>
          <Route path="/contacts" element={<ContactsScreen />} />
        </Routes>
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: contactsPageInitialState({ contacts: { contacts: mockPopulatedContacts() } }),
      },
    );

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
    const { user } = render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <Routes>
          <Route path="/contacts" element={<ContactsScreen />} />
        </Routes>
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: withFlagOverrides({
          lwdContacts: { enabled: true, params: { newBadge: false } },
        }),
      },
    );

    await user.click(screen.getByTestId("contacts-add-contact"));

    expect(screen.getByTestId("contacts-add-contact-dialog")).toBeVisible();
    expect(screen.getByTestId("contacts-add-contact-save")).toBeDisabled();

    const input = screen.getByTestId("contacts-add-contact-name-input");

    await user.type(input, "Ada1");

    expect(screen.getByText("Special characters are not allowed.")).toBeVisible();
    expect(screen.getByTestId("contacts-add-contact-save")).toBeDisabled();

    fireEvent.change(input, { target: { value: "Ada" } });

    expect(screen.queryByText("Special characters are not allowed.")).not.toBeInTheDocument();
    expect(screen.getByTestId("contacts-add-contact-save")).toBeEnabled();

    await user.click(screen.getByTestId("contacts-add-contact-save"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-add-contact-dialog")).not.toBeInTheDocument();
      expect(screen.getByText("Ada")).toBeVisible();
    });
  });

  it("should filter saved contacts when searching", async () => {
    const { user } = render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <Routes>
          <Route path="/contacts" element={<ContactsScreen />} />
        </Routes>
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: contactsPageInitialState({ contacts: { contacts: mockPopulatedContacts() } }),
      },
    );

    await user.type(screen.getByTestId("contacts-list-search"), "Ben");

    expect(screen.getByTestId("contacts-saved-row-contact-ben")).toBeVisible();
    expect(screen.queryByTestId("contacts-saved-row-contact-ada")).not.toBeInTheDocument();
    expect(screen.queryByTestId("contacts-saved-row-contact-olive")).not.toBeInTheDocument();
  });

  it("should render the no-results state when the search query has no match", async () => {
    const { user } = render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <Routes>
          <Route path="/contacts" element={<ContactsScreen />} />
        </Routes>
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: contactsPageInitialState({ contacts: { contacts: mockPopulatedContacts() } }),
      },
    );

    await user.type(screen.getByTestId("contacts-list-search"), "unknown");

    expect(screen.getByTestId("contacts-search-no-results")).toBeVisible();
    expect(screen.getByText("No contact found")).toBeVisible();
    expect(screen.queryByTestId("contacts-saved-row-contact-ben")).not.toBeInTheDocument();
  });

  it("should show the one-time feature introduction on first visit and complete it from Try contacts", async () => {
    const { user, store } = render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <Routes>
          <Route path="/contacts" element={<ContactsScreen />} />
        </Routes>
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: contactsPageInitialState({
          settings: { hasDismissedContactsFeatureIntroduction: false },
        }),
      },
    );

    expect(screen.getByTestId("contacts-feature-introduction-dialog")).toBeVisible();

    await user.click(screen.getByTestId("contacts-feature-introduction-primary"));

    expect(store.getState().settings.hasDismissedContactsFeatureIntroduction).toBe(true);
    expect(screen.queryByTestId("contacts-feature-introduction-dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("contacts-list")).toBeVisible();
  });

  it("should defer the feature introduction on Maybe later without persisting dismissal", async () => {
    mockNavigate.mockClear();

    const { user, store } = render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <Routes>
          <Route path="/contacts" element={<ContactsScreen />} />
        </Routes>
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: contactsPageInitialState({
          settings: { hasDismissedContactsFeatureIntroduction: false },
        }),
      },
    );

    expect(screen.getByTestId("contacts-feature-introduction-dialog")).toBeVisible();

    await user.click(screen.getByTestId("contacts-feature-introduction-secondary"));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
    expect(store.getState().settings.hasDismissedContactsFeatureIntroduction).toBe(false);
  });

  it("should render populated Me detail on load when populated contacts are persisted", () => {
    render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <Routes>
          <Route path="/contacts" element={<ContactsScreen />} />
        </Routes>
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: contactsPageInitialState({
          contacts: { contacts: mockPopulatedContacts() },
        }),
      },
    );

    expect(screen.getByTestId("contacts-detail-name")).toHaveTextContent("Me");
    expect(within(screen.getByTestId("contacts-detail-screen")).getByText("3 addresses")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-address-list")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-network-group-arbitrum")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-network-group-base")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-network-group-ethereum")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-address-row-address-me-arbitrum-usdc")).toBeVisible();
    expect(screen.queryByTestId("contacts-detail-empty-state")).not.toBeInTheDocument();
  });

  it("should render the default Me detail state on load", () => {
    render(
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

    expect(screen.getByTestId("contacts-detail-screen")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-me-avatar")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-name")).toHaveTextContent("Me");
    expect(screen.getByText("Add external address")).toBeVisible();
    expect(screen.getByText("No saved addresses for you")).toBeVisible();
  });

  it("should render the Me empty detail state when Me is selected after another contact", async () => {
    const { user } = render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <Routes>
          <Route path="/contacts" element={<ContactsScreen />} />
        </Routes>
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: contactsPageInitialState({
          contacts: {
            contacts: mockPopulatedContacts(),
          },
        }),
      },
    );

    await user.click(screen.getByTestId("contacts-saved-row-contact-ada"));
    await user.click(screen.getByTestId("contacts-me-row"));

    expect(screen.getByTestId("contacts-detail-name")).toHaveTextContent("Me");
    expect(screen.queryByText("No saved addresses for Ada")).not.toBeInTheDocument();
  });

  it("should render a saved contact empty detail state when an empty contact is selected", async () => {
    const { user } = render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <Routes>
          <Route path="/contacts" element={<ContactsScreen />} />
        </Routes>
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: contactsPageInitialState({ contacts: { contacts: mockPopulatedContacts() } }),
      },
    );

    await user.click(screen.getByTestId("contacts-saved-row-contact-ada"));

    expect(screen.getByTestId("contacts-detail-screen")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-avatar")).toBeVisible();
    expect(screen.getByText("No saved addresses for Ada")).toBeVisible();
    expect(
      screen.getByText("Save their wallet addresses to send to them by name next time."),
    ).toBeVisible();
    expect(screen.getByTestId("contacts-detail-add-address")).toBeVisible();
  });

  it("should open MAD from the real Add Address CTA with the eligible network ids", async () => {
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

    expect(store.getState().modularDialog.isOpen).toBe(true);
    expect(store.getState().modularDialog.dialogParams?.networkIds).toEqual(
      resolveEligibleAddressCurrencyIds(["evm"]),
    );
    expect(store.getState().modularDialog.dialogParams?.presentation).toBe("embedded");
    expect(store.getState().modularDialog.dialogParams?.onAccountSelected).toBeUndefined();
  });

  it("should keep one Contacts dialog mounted from currency selection to address entry", async () => {
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
    expect(dialog).toBeVisible();

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
    const { user } = render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <Routes>
          <Route path="/contacts" element={<ContactsScreen />} />
        </Routes>
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: contactsPageInitialState({ contacts: { contacts: mockPopulatedContacts() } }),
      },
    );

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
    const { user } = render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <Routes>
          <Route path="/contacts" element={<ContactsScreen />} />
        </Routes>
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: contactsPageInitialState({ contacts: { contacts: mockPopulatedContacts() } }),
      },
    );

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));
    await user.click(screen.getByTestId("contacts-detail-address-row-address-ethereum"));

    expect(screen.getByTestId("contacts-address-detail-dialog")).toBeVisible();
    expect(screen.getByTestId("contacts-address-detail-full-address")).toHaveTextContent(
      "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
    );
  });

  it("should close the address detail dialog when switching contacts", async () => {
    const { user } = render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <Routes>
          <Route path="/contacts" element={<ContactsScreen />} />
        </Routes>
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: contactsPageInitialState({ contacts: { contacts: mockPopulatedContacts() } }),
      },
    );

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));
    await user.click(screen.getByTestId("contacts-detail-address-row-address-ethereum"));

    expect(screen.getByTestId("contacts-address-detail-dialog")).toBeVisible();

    await user.click(screen.getByTestId("contacts-saved-row-contact-ada"));

    expect(screen.queryByTestId("contacts-address-detail-dialog")).not.toBeInTheDocument();
  });

  it("should switch populated detail when selecting another contact with addresses", async () => {
    const { user } = render(
      <MemoryRouter initialEntries={["/contacts"]}>
        <Routes>
          <Route path="/contacts" element={<ContactsScreen />} />
        </Routes>
      </MemoryRouter>,
      {
        skipRouter: true,
        initialState: contactsPageInitialState({ contacts: { contacts: mockPopulatedContacts() } }),
      },
    );

    await user.click(screen.getByTestId("contacts-saved-row-contact-ada"));
    expect(screen.getByTestId("contacts-detail-screen")).toBeVisible();
    expect(screen.getByText("No saved addresses for Ada")).toBeInTheDocument();

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));

    const detailScreen = screen.getByTestId("contacts-detail-screen");
    expect(detailScreen).toBeVisible();
    expect(within(detailScreen).getByText("2 addresses")).toBeInTheDocument();
    expect(screen.queryByText("No saved addresses for Ada")).not.toBeInTheDocument();
  });
});
