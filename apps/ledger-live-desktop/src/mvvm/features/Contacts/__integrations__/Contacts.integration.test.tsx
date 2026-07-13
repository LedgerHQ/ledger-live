import React from "react";
import { MemoryRouter, Route, Routes } from "react-router";
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
        initialState: withFlagOverrides({
          lwdContacts: { enabled: true, params: { newBadge: false } },
        }),
      },
    );

    expect(screen.getByTestId("contacts-page")).toBeVisible();
    expect(screen.getByTestId("contacts-page-header")).toBeVisible();
    expect(screen.getByTestId("contacts-list-pane")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-pane")).toBeEmptyDOMElement();
    expect(screen.getByRole("heading", { name: "Contacts" })).toBeVisible();
    expect(screen.getByPlaceholderText("Search contact")).toBeVisible();
    expect(screen.getByTestId("contacts-add-contact")).toBeVisible();
    expect(screen.getByTestId("contacts-add-contact-header")).toBeVisible();

    await waitFor(() => {
      expect(screen.getByTestId("contacts-empty-list-me-row")).toHaveTextContent("Me");
      expect(screen.getByTestId("contacts-empty-list-me-row")).toHaveTextContent("0 address");
    });
  });
});
