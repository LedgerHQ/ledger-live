import React from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { mockPopulatedContacts } from "@domain/entity-contact/schema.mock";
import { render, screen, withFlagOverrides, waitFor } from "tests/testSetup";
import ContactsScreen, { ContactsButton } from "LLD/features/Contacts";
import ContextMenuContext from "LLD/features/MyWallet/components/ContextMenuContext";
import { ContextMenu } from "LLD/features/MyWallet/components/ContextMenu";
import { CONTEXT_MENU_VIEW } from "LLD/features/MyWallet/components/ContextMenu/types";

const mockNavigate = jest.fn();
const mockClose = jest.fn();

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
    expect(screen.getByTestId("contacts-detail-pane")).toBeEmptyDOMElement();
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
    expect(screen.getByTestId("contacts-section-O")).toBeVisible();

    expect(screen.getByTestId("contacts-me-row")).toHaveTextContent("Me");
    expect(screen.getByTestId("contacts-saved-row-contact-ada")).toHaveTextContent("Ada");
    expect(screen.getByTestId("contacts-saved-row-contact-ben")).toHaveTextContent("Ben");
    expect(screen.getByTestId("contacts-saved-row-contact-olive")).toHaveTextContent("Olive");
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
});
