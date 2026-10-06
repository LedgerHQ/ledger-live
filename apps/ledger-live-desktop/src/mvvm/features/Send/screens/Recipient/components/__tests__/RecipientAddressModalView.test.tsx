/**
 * @jest-environment jsdom
 */
import { mockContact, mockContactAddress } from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import React from "react";
import { render, screen } from "tests/testSetup";
import { RecipientAddressModalView } from "../RecipientAddressModalView";

jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: () => ({
    state: {
      account: { account: null, parentAccount: null },
      transaction: { transaction: null },
      recipient: {},
    },
  }),
  useSendFlowActions: () => ({
    transaction: { setRecipient: jest.fn() },
  }),
}));

jest.mock("../../../../context/RecipientContinuationContext", () => ({
  useRecipientContinuation: () => ({
    isFamilyRecipientBlocked: false,
    setFamilyRecipientBlocked: jest.fn(),
  }),
}));

jest.mock("../../../../../FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: () => ({
    navigation: { goToNextStep: jest.fn() },
  }),
}));

const contacts = Array.from({ length: 12 }, (_, index) =>
  mockContact({
    id: `contact-${index}`,
    name: `Contact ${index}`,
    addresses: [mockContactAddress({ id: `address-${index}` })],
  }),
);

describe("RecipientAddressModalView", () => {
  it("should keep a scrollable dialog body when many contacts are listed", () => {
    render(
      <Dialog open height="fixed">
        <DialogContent>
          <RecipientAddressModalView
            isLoading={false}
            showInitialState
            showContactsList
            showContactSearchResult={false}
            showEmptyContactsState={false}
            contactsOnNetwork={contacts}
            contactSearchResult={undefined}
            selectedContact={undefined}
            network={getCryptoCurrencyById("ethereum")}
            handleContactSelect={jest.fn()}
            handleContactAddressSelect={jest.fn()}
            showMatchedAddress={false}
            showAddressValidationError={false}
            showEmptyState={false}
            showBridgeSenderError={false}
            showSanctionedBanner={false}
            showBridgeRecipientError={false}
            showBridgeRecipientWarning={false}
            addressValidationErrorType={null}
            bridgeRecipientError={undefined}
            bridgeRecipientWarning={undefined}
            bridgeSenderError={undefined}
            hasMemoValidationError={false}
            addressMatchedSectionViewModel={{
              isVisible: false,
              showHeader: false,
              addressMatchedLabel: "",
              suggestion: null,
              showFirstInteractionWarning: false,
            }}
            featureIntroduction={{
              isOpen: false,
              title: "",
              highlights: [],
              primaryActionLabel: "",
              onComplete: jest.fn(),
              onClose: jest.fn(),
            }}
          />
        </DialogContent>
      </Dialog>,
    );

    const dialogBody = document.querySelector('[data-slot="dialog-body"]');

    expect(dialogBody).not.toBeNull();
    expect(dialogBody).toHaveClass("min-h-0");
    expect(dialogBody).toHaveClass("overflow-y-auto");
    expect(dialogBody).toHaveClass("scrollbar-custom");
    expect(dialogBody).not.toHaveClass("min-h-[156px]");
    expect(screen.getByTestId("send-recipient-contacts")).toBeVisible();
    expect(screen.getAllByTestId(/contacts-compact-row-/)).toHaveLength(contacts.length);
  });
});
