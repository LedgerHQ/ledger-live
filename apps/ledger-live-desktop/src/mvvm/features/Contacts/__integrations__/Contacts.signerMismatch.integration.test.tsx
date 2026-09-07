import React from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { mockPopulatedContacts } from "@domain/entity-contact/schema.mock";
import { render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import ContactsScreen from "LLD/features/Contacts";

jest.mock("@features/flow-contacts", () => {
  const actual =
    jest.requireActual<typeof import("@features/flow-contacts")>("@features/flow-contacts");
  const mismatchPort = actual.createMockContactSignerValidationPort({
    currentSignerId: "signer-b",
  });

  return {
    ...actual,
    useContactsAddressDetailActionsPorts: (
      deviceIntents: Parameters<typeof actual.useContactsAddressDetailActionsPorts>[0],
      signerValidation?: Parameters<typeof actual.useContactsAddressDetailActionsPorts>[1],
    ) =>
      actual.useContactsAddressDetailActionsPorts(deviceIntents, signerValidation ?? mismatchPort),
    useContactsEditDeletePorts: (
      deviceIntents: Parameters<typeof actual.useContactsEditDeletePorts>[0],
      signerValidation?: Parameters<typeof actual.useContactsEditDeletePorts>[1],
    ) => actual.useContactsEditDeletePorts(deviceIntents, signerValidation ?? mismatchPort),
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

async function expectSignerMismatchDialog(user: Awaited<ReturnType<typeof render>>["user"]) {
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
}

describe("Contacts signer mismatch integration", () => {
  it("should show the signer mismatch dialog when address edit validation fails", async () => {
    const { user } = renderContactsScreen({ contacts: { contacts: mockPopulatedContacts() } });

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));
    await user.click(screen.getByTestId("contacts-detail-address-row-address-ethereum"));
    await user.click(screen.getByTestId("contacts-address-detail-edit"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-rename-address-dialog")).toBeVisible();
    });

    const labelInput = screen.getByTestId("contacts-rename-address-input");
    await user.clear(labelInput);
    await user.type(labelInput, "Main ETH");
    await user.click(screen.getByTestId("contacts-rename-address-confirm"));

    await expectSignerMismatchDialog(user);
  });

  it("should show the signer mismatch dialog when contact edit validation fails", async () => {
    const { user } = renderContactsScreen({ contacts: { contacts: mockPopulatedContacts() } });

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));
    await user.click(screen.getByTestId("contacts-detail-edit-action"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-rename-contact-dialog")).toBeVisible();
    });

    const nameInput = screen.getByTestId("contacts-rename-contact-name-input");
    await user.clear(nameInput);
    await user.type(nameInput, "Benjamin");
    await user.click(screen.getByTestId("contacts-rename-contact-confirm"));

    await expectSignerMismatchDialog(user);
  });

  it("should return to the edit dialog with the draft intact when the mismatch is cancelled", async () => {
    const { user } = renderContactsScreen({ contacts: { contacts: mockPopulatedContacts() } });

    await user.click(screen.getByTestId("contacts-saved-row-contact-ben"));
    await user.click(screen.getByTestId("contacts-detail-edit-action"));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-rename-contact-dialog")).toBeVisible();
    });

    const nameInput = screen.getByTestId("contacts-rename-contact-name-input");
    await user.clear(nameInput);
    await user.type(nameInput, "Benjamin");
    await user.click(screen.getByTestId("contacts-rename-contact-confirm"));

    await expectSignerMismatchDialog(user);

    await user.click(screen.getByTestId("contacts-edit-signer-mismatch-cancel"));

    await waitFor(() => {
      expect(screen.queryByTestId("contacts-edit-signer-mismatch-dialog")).not.toBeInTheDocument();
      expect(screen.getByTestId("contacts-rename-contact-dialog")).toBeVisible();
      expect(screen.getByTestId("contacts-rename-contact-name-input")).toHaveValue("Benjamin");
    });
    expect(screen.getByTestId("contacts-saved-row-contact-ben")).toHaveTextContent("Ben");
  });
});
