import React from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { mockPopulatedContacts } from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { act, fireEvent, render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import ContactsScreen from "LLD/features/Contacts";
import { useActivationDrawer } from "LLD/features/LedgerSyncEntryPoints/hooks/useActivationDrawer";
import { useContactsLedgerSyncStatus } from "LLD/features/Contacts/hooks/useContactsLedgerSyncStatus";

// This suite exercises the real orchestrator, unlike the regular Contacts integration suite.
jest.unmock("@features/platform-contacts/device");

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

jest.mock("LLD/features/Contacts/hooks/useContactsLedgerSyncStatus", () => ({
  useContactsLedgerSyncStatus: jest.fn(),
}));

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
  resetStore: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  ...jest.requireActual<typeof import("@ledgerhq/live-common/bridge/index")>(
    "@ledgerhq/live-common/bridge/index",
  ),
  getAccountBridgeByFamily: jest.fn().mockResolvedValue({
    validateAddress: async () => true,
  }),
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

async function expectDeviceIntentExecutor() {
  await waitFor(() => {
    expect(screen.getByTestId("device-intent-executor-dialog")).toBeVisible();
  });
}

describe("Contacts device intents integration", () => {
  beforeEach(() => {
    jest.mocked(useActivationDrawer).mockReturnValue({
      openDrawer: jest.fn(),
      closeDrawer: jest.fn(),
    });
    jest.mocked(useContactsLedgerSyncStatus).mockReturnValue("ready");
  });

  it("should open the device intent executor alone when editing an address", async () => {
    const { user } = renderContactsScreen();

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

    await expectDeviceIntentExecutor();
    expect(screen.queryByTestId("contacts-rename-address-dialog")).not.toBeInTheDocument();
    expect(screen.queryByTestId("contacts-address-detail-dialog")).not.toBeInTheDocument();
  });

  it("should open the device intent executor alone when adding an address", async () => {
    const { store, user } = renderContactsScreen();

    await user.click(screen.getByTestId("contacts-saved-row-contact-ada"));
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
      expect(screen.getByTestId("contacts-add-address-confirm")).toBeEnabled();
    });
    await user.click(screen.getByTestId("contacts-add-address-confirm"));

    await expectDeviceIntentExecutor();
    expect(screen.queryByTestId("contacts-add-address-confirm")).not.toBeInTheDocument();
  });

  it("should open the device intent executor alone when renaming a contact", async () => {
    const { user } = renderContactsScreen();

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));
    await user.click(screen.getByTestId("contacts-detail-edit-action"));
    const nameInput = await screen.findByTestId("contacts-rename-contact-name-input");
    await user.clear(nameInput);
    await user.type(nameInput, "Benjamin");
    await user.click(screen.getByTestId("contacts-rename-contact-confirm"));

    await expectDeviceIntentExecutor();
    expect(screen.queryByTestId("contacts-rename-contact-dialog")).not.toBeInTheDocument();
  });

  it("should dismiss the calling flow when the device intent executor is cancelled", async () => {
    const { user } = renderContactsScreen();

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));
    await user.click(screen.getByTestId("contacts-detail-edit-action"));
    const nameInput = await screen.findByTestId("contacts-rename-contact-name-input");
    await user.clear(nameInput);
    await user.type(nameInput, "Benjamin");
    await user.click(screen.getByTestId("contacts-rename-contact-confirm"));
    await expectDeviceIntentExecutor();

    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(screen.queryByTestId("device-intent-executor-dialog")).not.toBeInTheDocument();
      expect(screen.queryByTestId("contacts-rename-contact-dialog")).not.toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByTestId("contacts-detail-screen")).toBeVisible();
    });
    expect(screen.getByTestId("contacts-detail-name")).toHaveTextContent("Ben");
  });
});
