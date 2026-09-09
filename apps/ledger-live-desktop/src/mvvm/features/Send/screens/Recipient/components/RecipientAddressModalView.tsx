import React from "react";
import { DialogBody } from "@ledgerhq/lumen-ui-react";
import type { AddressValidationError as AddressValidationErrorType } from "@ledgerhq/live-common/flows/send/recipient/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Contact, ContactAddress } from "@domain/entity-contact";
import {
  ContactsFeatureIntroductionDialog,
  type ContactsFeatureIntroduction,
} from "@features/flow-contacts-introduction";
import type { AddressMatchedSectionViewModel } from "../hooks/useAddressMatchedSectionViewModel";
import { AddressMatchedSection } from "./AddressMatchedSection";
import { AddressValidationError } from "./AddressValidationError";
import EmptyList from "./EmptyList";
import { LoadingState } from "./LoadingState";
import { RecipientEmptyContactsState } from "./RecipientEmptyContactsState";
import { RecipientIntroCard } from "./RecipientIntroCard";
import { ValidationBanner } from "./ValidationBanner";
import { RecipientContactsList } from "./RecipientContactsList";
import { RecipientContactAddressSelection } from "./RecipientContactAddressSelection";

type RecipientAddressModalViewProps = Readonly<{
  isLoading: boolean;
  showInitialState: boolean;
  showContactsList: boolean;
  showContactSearchResult: boolean;
  showEmptyContactsState: boolean;
  contactsOnNetwork: readonly Contact[];
  contactSearchResult: Contact | undefined;
  selectedContact: Contact | undefined;
  network: CryptoCurrency;
  handleContactSelect: (contact: Contact) => void;
  handleContactAddressSelect: (address: ContactAddress, addressRank: number) => void;
  showMatchedAddress: boolean;
  showAddressValidationError: boolean;
  showEmptyState: boolean;
  showBridgeSenderError: boolean;
  showSanctionedBanner: boolean;
  showBridgeRecipientError: boolean;
  showBridgeRecipientWarning: boolean;
  addressValidationErrorType: AddressValidationErrorType | null;
  bridgeRecipientError: Error | undefined;
  bridgeRecipientWarning: Error | undefined;
  bridgeSenderError: Error | undefined;
  hasMemoValidationError: boolean;
  addressMatchedSectionViewModel: AddressMatchedSectionViewModel;
  featureIntroduction: ContactsFeatureIntroduction;
}>;

export function RecipientAddressModalView({
  isLoading,
  showInitialState,
  showContactsList,
  showContactSearchResult,
  showEmptyContactsState,
  contactsOnNetwork,
  contactSearchResult,
  selectedContact,
  network,
  handleContactSelect,
  handleContactAddressSelect,
  showMatchedAddress,
  showAddressValidationError,
  showEmptyState,
  showBridgeSenderError,
  showSanctionedBanner,
  showBridgeRecipientError,
  showBridgeRecipientWarning,
  addressValidationErrorType,
  bridgeRecipientError,
  bridgeRecipientWarning,
  bridgeSenderError,
  hasMemoValidationError,
  addressMatchedSectionViewModel,
  featureIntroduction,
}: RecipientAddressModalViewProps) {
  const shouldShowErrorBanner =
    !isLoading &&
    (showBridgeSenderError ||
      showSanctionedBanner ||
      showBridgeRecipientError ||
      showBridgeRecipientWarning);

  // An empty memo no longer blocks the matched address: selecting it routes to the
  // skip-memo confirmation step, which is where skipping is acknowledged.
  const showMatched = showMatchedAddress && !hasMemoValidationError;

  return (
    <DialogBody className="flex min-h-[156px] flex-col py-16">
      <ContactsFeatureIntroductionDialog {...featureIntroduction} />

      {isLoading && !showMatched && <LoadingState />}

      {showInitialState && showEmptyContactsState && <RecipientEmptyContactsState />}

      {showInitialState && showContactsList && (
        <RecipientContactsList contacts={contactsOnNetwork} onContactSelect={handleContactSelect} />
      )}

      {showContactSearchResult && contactSearchResult && (
        <RecipientContactsList
          contacts={[contactSearchResult]}
          onContactSelect={handleContactSelect}
        />
      )}

      {showInitialState && !showEmptyContactsState && !showContactsList && <RecipientIntroCard />}

      {selectedContact && (
        <RecipientContactAddressSelection
          contact={selectedContact}
          network={network}
          onAddressSelect={handleContactAddressSelect}
        />
      )}

      {showMatched && <AddressMatchedSection viewModel={addressMatchedSectionViewModel} />}

      {showAddressValidationError && (
        <div className="flex flex-1 items-center justify-center">
          <AddressValidationError error={addressValidationErrorType} />
        </div>
      )}

      {showEmptyState && <EmptyList translationKey="newSendFlow.recentSendWillAppear" />}

      {shouldShowErrorBanner && (
        <div className="mt-6 flex flex-col gap-16">
          {showBridgeSenderError && (
            <ValidationBanner type="error" error={bridgeSenderError} variant="sender" />
          )}
          {showSanctionedBanner && <ValidationBanner type="sanctioned" />}
          {showBridgeRecipientError && (
            <ValidationBanner
              type="error"
              error={bridgeRecipientError}
              variant="recipient"
              excludeRecipientRequired
            />
          )}
          {showBridgeRecipientWarning && (
            <ValidationBanner type="warning" warning={bridgeRecipientWarning} variant="recipient" />
          )}
        </div>
      )}
    </DialogBody>
  );
}
