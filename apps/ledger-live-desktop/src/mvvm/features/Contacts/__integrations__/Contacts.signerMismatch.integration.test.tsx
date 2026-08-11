import React from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { mockPopulatedContacts } from "@domain/entity-contact/schema.mock";
import { render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import ContactsScreen from "LLD/features/Contacts";

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

function renderContactsScreen(extraInitialState: Record<string, unknown> = {}) {
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
        settings: {
          hasDismissedContactsFeatureIntroduction: true,
        },
        ...extraInitialState,
      },
    },
  );
}

describe("Contacts signer mismatch integration", () => {
  it("should show the signer mismatch dialog when validation fails", async () => {
    const { user } = renderContactsScreen({ contacts: { contacts: mockPopulatedContacts() } });

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));
    await user.click(screen.getByTestId("contacts-detail-address-row-address-ethereum"));
    await user.click(screen.getByTestId("contacts-address-detail-edit"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-edit-signer-dialog")).toBeVisible();
    });

    await user.click(screen.getByTestId("contacts-edit-signer-confirm"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-edit-signer-dialog")).not.toBeInTheDocument();
      expect(screen.getByTestId("contacts-edit-signer-mismatch-dialog")).toBeVisible();
      expect(
        screen.getByText("Use the same Ledger device you used to add this contact"),
      ).toBeVisible();
      expect(screen.getByText("The connected device isn't a match.")).toBeVisible();
    });
  });
});
