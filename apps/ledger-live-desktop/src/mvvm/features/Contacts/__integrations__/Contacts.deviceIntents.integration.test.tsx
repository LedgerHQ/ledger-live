import React from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { mockPopulatedContacts } from "@domain/entity-contact/schema.mock";
import { fireEvent, render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import ContactsScreen from "LLD/features/Contacts";
import { useActivationDrawer } from "LLD/features/LedgerSyncEntryPoints/hooks/useActivationDrawer";

jest.mock("react-router", () => ({
  ...jest.requireActual<typeof import("react-router")>("react-router"),
  useNavigate: () => jest.fn(),
}));

jest.mock("LLD/features/Send/hooks/useOpenSendFlow", () => ({
  useOpenSendFlow: () => jest.fn(),
}));

jest.mock("LLD/features/LedgerSyncEntryPoints/hooks/useActivationDrawer", () => ({
  useActivationDrawer: jest.fn(),
}));

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
  resetStore: jest.fn(),
}));

function renderContactsScreen() {
  return render(
    <MemoryRouter initialEntries={["/contacts"]}>
      <Routes>
        <Route path="/contacts" element={<ContactsScreen />} />
      </Routes>
    </MemoryRouter>,
    {
      skipRouter: true,
      initialState: {
        ...withFlagOverrides({
          lwdContacts: { enabled: true, params: { newBadge: false } },
        }),
        settings: { hasDismissedContactsFeatureIntroduction: true },
        contacts: { contacts: mockPopulatedContacts() },
      },
    },
  );
}

async function confirmSigner(user: Awaited<ReturnType<typeof render>>["user"]) {
  await waitFor(() => {
    expect(screen.getByTestId("contacts-edit-signer-dialog")).toBeVisible();
  });

  await user.click(screen.getByTestId("contacts-edit-signer-confirm"));
}

describe("Contacts device intents integration", () => {
  beforeEach(() => {
    jest.mocked(useActivationDrawer).mockReturnValue({
      openDrawer: jest.fn(),
      closeDrawer: jest.fn(),
    });
  });

  it("should open the device intent executor alone when editing an address", async () => {
    const { user } = renderContactsScreen();

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));
    await user.click(screen.getByTestId("contacts-detail-address-row-address-ethereum"));
    await user.click(screen.getByTestId("contacts-address-detail-edit"));

    await confirmSigner(user);

    await waitFor(() => {
      expect(screen.getByTestId("contacts-rename-address-dialog")).toBeVisible();
    });

    fireEvent.change(screen.getByTestId("contacts-rename-address-input"), {
      target: { value: "Main ETH" },
    });
    await user.click(screen.getByTestId("contacts-rename-address-confirm"));

    await waitFor(() => {
      expect(screen.getByTestId("device-intent-executor-dialog")).toBeVisible();
    });
    expect(screen.queryByTestId("contacts-rename-address-dialog")).not.toBeInTheDocument();
    expect(screen.queryByTestId("contacts-address-detail-dialog")).not.toBeInTheDocument();
  });
});
