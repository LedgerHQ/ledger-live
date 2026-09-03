import React from "react";
import { mockPopulatedContacts } from "@domain/entity-contact/schema.mock";
import { render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { connectDevice, useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import { useContactsLedgerSyncStatus } from "LLM/features/Contacts/hooks/useContactsLedgerSyncStatus";
import MyWalletNavigator from "LLM/features/MyWallet/Navigator";
import { useMyWalletHeaderViewModel } from "LLM/features/MyWallet/views/Header/useMyWalletHeaderViewModel";

// This suite exercises the real orchestrator, unlike the regular Contacts integration suite.
jest.unmock("@features/platform-contacts/device");

jest.mock("LLM/features/MyWallet/views/Header/useMyWalletHeaderViewModel");
jest.mock("LLM/features/Contacts/hooks/useContactsLedgerSyncStatus");
jest.mock("@ledgerhq/live-dmk-mobile", () => ({
  ...jest.requireActual("@ledgerhq/live-dmk-mobile"),
  connectDevice: jest.fn(),
  useDeviceManagementKit: jest.fn(),
}));
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
const mockedConnectDevice = jest.mocked(connectDevice);
const mockedUseDeviceManagementKit = jest.mocked(useDeviceManagementKit);
const noop = () => undefined;

function renderContactsScreen() {
  return render(<MyWalletNavigator />, {
    overrideInitialState: withFlagOverrides(
      { lwmContacts: { enabled: true, params: { newBadge: false } } },
      state => ({
        ...state,
        settings: {
          ...state.settings,
          hasDismissedContactsFeatureIntroduction: true,
        },
        contacts: { contacts: mockPopulatedContacts() },
      }),
    ),
  });
}

async function expectDeviceIntentExecutor() {
  await waitFor(() => {
    expect(screen.getByText("Loading")).toBeVisible();
  });
}

describe("Contacts device intents integration", () => {
  beforeEach(() => {
    mockedUseDeviceManagementKit.mockReturnValue(
      {} as NonNullable<ReturnType<typeof useDeviceManagementKit>>,
    );
    mockedConnectDevice.mockReturnValue({
      subscribe: () => ({ unsubscribe: noop }),
    } as ReturnType<typeof connectDevice>);
    mockedContactsLedgerSyncStatus.mockReturnValue("ready");
    mockedViewModel.mockReturnValue({
      onBackPress: noop,
      onNotificationsPress: noop,
      onSettingsPress: noop,
      hasUnreadNotifications: false,
    });
  });

  it("should open the device intent executor alone when editing an address", async () => {
    const { user } = renderContactsScreen();

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ben"));
    await user.press(await screen.findByTestId("contacts-detail-address-row-address-ethereum"));
    await user.press(await screen.findByTestId("contacts-address-detail-edit"));

    const renameInput = await screen.findByDisplayValue("Ethereum");
    await user.clear(renameInput);
    await user.type(renameInput, "Main ETH");
    await user.press(screen.getByTestId("contacts-rename-address-confirm"));

    await expectDeviceIntentExecutor();
    expect(screen.queryByTestId("contacts-rename-address-sheet")).toBeNull();
    expect(screen.queryByTestId("contacts-address-detail-sheet")).toBeNull();
  });

  it("should open the device intent executor alone when adding an address", async () => {
    const { user } = renderContactsScreen();

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ada"));
    await user.press(await screen.findByTestId("contacts-detail-add-address"));
    await user.press(await screen.findByTestId("asset-item-USDT"));
    await user.press(await screen.findByTestId("network-item-Ethereum"));

    const addressInput = await screen.findByTestId("contacts-add-address-input");
    await user.type(addressInput, "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034");
    await waitFor(() => {
      expect(screen.getByTestId("contacts-add-address-confirm")).toBeEnabled();
    });
    await user.press(screen.getByTestId("contacts-add-address-confirm"));
    await user.press(await screen.findByTestId("contacts-add-address-name-continue"));

    await expectDeviceIntentExecutor();
    expect(screen.queryByTestId("contacts-add-address-flow-drawer")).toBeNull();
  });

  it("should open the device intent executor alone when renaming a contact", async () => {
    const { user } = renderContactsScreen();

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ben"));
    await user.press(await screen.findByTestId("contacts-detail-actions-trigger"));
    await user.press(await screen.findByTestId("contacts-detail-edit-action"));

    const renameInput = await screen.findByTestId("contacts-rename-contact-name-input");
    await user.clear(renameInput);
    await user.type(renameInput, "Benjamin");
    await user.press(screen.getByTestId("contacts-rename-contact-confirm"));

    await expectDeviceIntentExecutor();
    expect(screen.queryByTestId("contacts-rename-contact-sheet")).toBeNull();
  });

  it("should dismiss the calling flow when the device intent executor is cancelled", async () => {
    const { user } = renderContactsScreen();

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ben"));
    await user.press(await screen.findByTestId("contacts-detail-actions-trigger"));
    await user.press(await screen.findByTestId("contacts-detail-edit-action"));

    const renameInput = await screen.findByTestId("contacts-rename-contact-name-input");
    await user.clear(renameInput);
    await user.type(renameInput, "Benjamin");
    await user.press(screen.getByTestId("contacts-rename-contact-confirm"));
    await expectDeviceIntentExecutor();

    await user.press(screen.getByTestId("bottom-sheet-header-close-button"));

    await waitFor(() => {
      expect(screen.queryByText("Loading")).toBeNull();
      expect(screen.queryByTestId("contacts-rename-contact-sheet")).toBeNull();
      expect(screen.queryByTestId("contacts-edit-signer-sheet")).toBeNull();
      expect(screen.getByTestId("contacts-detail-screen")).toBeVisible();
    });
    expect(screen.getByTestId("contacts-detail-name")).toHaveTextContent("Ben");
  });
});
