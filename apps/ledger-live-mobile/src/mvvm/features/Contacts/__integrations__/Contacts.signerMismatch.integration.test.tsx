import React from "react";
import { mockPopulatedContacts } from "@domain/entity-contact/schema.mock";
import { render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { useContactsLedgerSyncStatus } from "LLM/features/Contacts/hooks/useContactsLedgerSyncStatus";
import MyWalletNavigator from "LLM/features/MyWallet/Navigator";
import { useMyWalletHeaderViewModel } from "LLM/features/MyWallet/views/Header/useMyWalletHeaderViewModel";

jest.mock("LLM/features/MyWallet/views/Header/useMyWalletHeaderViewModel");
jest.mock("LLM/features/Contacts/hooks/useContactsLedgerSyncStatus");

const mockedViewModel = jest.mocked(useMyWalletHeaderViewModel);
const mockedContactsLedgerSyncStatus = jest.mocked(useContactsLedgerSyncStatus);
const noop = () => undefined;

jest.mock("LLM/features/Contacts/hooks/useContactsAddressValidationAdapter", () => ({
  useContactsAddressValidationAdapter: () => ({
    validateAddress: async ({ address }: { address: string }) => ({
      status: "valid",
      resolvedAddress: address,
      isDomain: false,
    }),
  }),
}));

jest.mock("@features/flow-contacts", () => {
  const actual =
    jest.requireActual<typeof import("@features/flow-contacts")>("@features/flow-contacts");

  return {
    ...actual,
    useContactsAddressDetailActionsPorts: (
      signerValidation?: Parameters<typeof actual.useContactsAddressDetailActionsPorts>[0],
    ) =>
      actual.useContactsAddressDetailActionsPorts(
        signerValidation ??
          actual.createMockContactSignerValidationPort({
            currentSignerId: "signer-b",
          }),
      ),
  };
});

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

describe("Contacts signer mismatch integration", () => {
  beforeEach(() => {
    mockedContactsLedgerSyncStatus.mockReturnValue("ready");
    mockedViewModel.mockReturnValue({
      onBackPress: noop,
      onNotificationsPress: noop,
      onSettingsPress: noop,
      hasUnreadNotifications: false,
    });
  });

  it("should show the signer mismatch sheet when validation fails", async () => {
    const { user } = render(<MyWalletNavigator />, {
      overrideInitialState: withContactsPageReadyState(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({ ...state, contacts: { contacts: mockPopulatedContacts() } }),
      ),
    });

    await user.press(screen.getByTestId("my-wallet-contacts-button"));
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ben"));
    await user.press(await screen.findByTestId("contacts-detail-address-row-address-ethereum"));
    await user.press(await screen.findByTestId("contacts-address-detail-edit"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-edit-signer-confirm")).toBeVisible();
    });

    await user.press(screen.getByTestId("contacts-edit-signer-confirm"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-edit-signer-confirm")).toBeNull();
      expect(
        screen.getByText("Use the same Ledger device you used to add this contact"),
      ).toBeVisible();
      expect(screen.getByText("The connected device isn't a match.")).toBeVisible();
      expect(screen.getByTestId("contacts-edit-signer-mismatch-connect")).toBeVisible();
    });
  });
});
