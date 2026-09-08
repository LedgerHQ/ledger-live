import { getRecipientMatchPresentation } from "@ledgerhq/live-common/flows/send/recipient/utils/getRecipientMatchPresentation";
import type {
  AddressSearchResult,
  MatchedContact,
} from "@ledgerhq/live-common/flows/send/recipient/types";
import { SEND_ADDRESS_FORMAT_OPTIONS } from "@ledgerhq/live-common/flows/send/utils";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { useFeature } from "@features/platform-feature-flags";
import { useTranslation } from "react-i18next";
import { useFormatRelativeDate } from "./useFormatRelativeDate";

type UseAddressMatchedSectionViewModelProps = Readonly<{
  searchResult: AddressSearchResult;
  searchValue: string;
  onSelect: (address: string, ensName?: string) => void;
  onAddContact: () => void;
  onUnsupportedNetwork: () => void;
  isSanctioned?: boolean;
  isAddressComplete?: boolean;
  hasBridgeError?: boolean;
  isContactsFeatureEnabled?: boolean;
  hasAddressBook?: boolean;
  addressBookFamilyName?: string;
}>;

type AddressListItemSuggestion = Readonly<{
  kind: "address-list-item";
  address: string;
  name?: string;
  description?: string;
  onSelect?: () => void;
  isLedgerAccount?: boolean;
  disabled?: boolean;
  hideDescription?: boolean;
}>;

type RecipientCardSuggestion = Readonly<{
  kind: "recipient-card";
  recipient: string;
  description?: string;
  contact?: MatchedContact;
  isReady: boolean;
  showActions: boolean;
  hasAddressBook: boolean;
  addressBookUnsupportedLabel: string;
  addContactLabel: string;
  sendLabel: string;
  onSend: () => void;
  onAddContact: () => void;
  onUnsupportedNetwork: () => void;
}>;

export type AddressMatchedSectionViewModel = Readonly<{
  isVisible: boolean;
  showHeader: boolean;
  addressMatchedLabel: string;
  suggestion: AddressListItemSuggestion | RecipientCardSuggestion | null;
  showFirstInteractionWarning: boolean;
}>;

export function useAddressMatchedSectionViewModel({
  searchResult,
  searchValue,
  onSelect,
  onAddContact,
  onUnsupportedNetwork,
  isSanctioned = false,
  isAddressComplete = false,
  hasBridgeError = false,
  isContactsFeatureEnabled = false,
  hasAddressBook = false,
  addressBookFamilyName = "",
}: UseAddressMatchedSectionViewModelProps): AddressMatchedSectionViewModel {
  const { t } = useTranslation();
  const formatRelativeDate = useFormatRelativeDate();
  const isFirstInteractionBannerEnabled =
    useFeature("newSendFlowFirstInteractionBanner")?.enabled ?? false;
  const addressMatchedLabel = t("newSendFlow.addressMatched");
  const recipientAddress = searchResult.resolvedAddress ?? searchValue;
  const shouldShowErrorRecipientCard =
    isContactsFeatureEnabled && isAddressComplete && (hasBridgeError || isSanctioned);

  if (shouldShowErrorRecipientCard) {
    return {
      isVisible: true,
      showHeader: false,
      addressMatchedLabel,
      suggestion: {
        kind: "recipient-card",
        recipient: recipientAddress,
        contact: undefined,
        isReady: false,
        showActions: false,
        hasAddressBook,
        addressBookUnsupportedLabel: t("newSendFlow.addressBookUnsupported", {
          family: addressBookFamilyName,
        }),
        addContactLabel: t("contacts.addContact"),
        sendLabel: t("contacts.addressDetail.send"),
        onSend: () => onSelect(recipientAddress, searchResult.ensName),
        onAddContact,
        onUnsupportedNetwork,
      },
      showFirstInteractionWarning: false,
    };
  }

  const presentation = getRecipientMatchPresentation({
    searchResult,
    searchValue,
    isSanctioned,
    isAddressComplete,
    hasBridgeError,
    isContactsFeatureEnabled,
  });

  if (!presentation) {
    return {
      isVisible: false,
      showHeader: false,
      addressMatchedLabel,
      suggestion: null,
      showFirstInteractionWarning: false,
    };
  }

  const formattedAddress = formatAddress(
    presentation.kind === "recipient-card" ? presentation.recipientAddress : presentation.address,
    SEND_ADDRESS_FORMAT_OPTIONS,
  );
  const getAlreadyUsedDescription = (lastUsedAt?: Date): string | undefined => {
    if (!lastUsedAt) {
      return undefined;
    }

    return t("newSendFlow.alreadyUsed", {
      date: formatRelativeDate(lastUsedAt),
    });
  };

  const showFirstInteractionWarning =
    isFirstInteractionBannerEnabled &&
    searchResult.isFirstInteraction &&
    !isSanctioned &&
    !hasBridgeError &&
    isAddressComplete;

  switch (presentation.kind) {
    case "recipient-card":
      return {
        isVisible: true,
        showHeader: false,
        addressMatchedLabel,
        suggestion: {
          kind: "recipient-card",
          recipient: presentation.ensName ?? presentation.recipientAddress,
          description: presentation.ensName
            ? presentation.recipientAddress
            : getAlreadyUsedDescription(presentation.matchedRecentAddress?.lastUsedAt),
          contact: presentation.matchedContact,
          isReady: presentation.isReady,
          showActions: !hasBridgeError,
          hasAddressBook,
          addressBookUnsupportedLabel: t("newSendFlow.addressBookUnsupported", {
            family: addressBookFamilyName,
          }),
          addContactLabel: t("contacts.addContact"),
          sendLabel: t("contacts.addressDetail.send"),
          onSend: () => onSelect(presentation.recipientAddress, presentation.ensName),
          onAddContact,
          onUnsupportedNetwork,
        },
        showFirstInteractionWarning,
      };
    case "matched-contact":
      return {
        isVisible: true,
        showHeader: true,
        addressMatchedLabel,
        suggestion: {
          kind: "address-list-item",
          address: presentation.address,
          name: presentation.matchedContact.contactName,
          description: formattedAddress,
          onSelect: () => onSelect(presentation.address, presentation.ensName),
          disabled: presentation.isDisabled,
        },
        showFirstInteractionWarning,
      };
    case "matched-ens":
      return {
        isVisible: true,
        showHeader: true,
        addressMatchedLabel,
        suggestion: {
          kind: "address-list-item",
          address: presentation.address,
          name: `${presentation.ensName} (${formattedAddress})`,
          description: formattedAddress,
          onSelect: () => onSelect(presentation.address, presentation.ensName),
          disabled: presentation.isDisabled,
        },
        showFirstInteractionWarning,
      };
    case "matched-ledger-account":
      return {
        isVisible: true,
        showHeader: true,
        addressMatchedLabel,
        suggestion: {
          kind: "address-list-item",
          address: presentation.address,
          name: presentation.accountName,
          description:
            getAlreadyUsedDescription(presentation.matchedRecentAddress?.lastUsedAt) ??
            formattedAddress,
          onSelect: () =>
            onSelect(presentation.address, presentation.matchedRecentAddress?.ensName),
          isLedgerAccount: true,
          disabled: presentation.isDisabled,
        },
        showFirstInteractionWarning,
      };
    case "matched-recent-address":
      return {
        isVisible: true,
        showHeader: true,
        addressMatchedLabel,
        suggestion: {
          kind: "address-list-item",
          address: presentation.address,
          description:
            getAlreadyUsedDescription(presentation.matchedRecentAddress.lastUsedAt) ??
            formattedAddress,
          onSelect: () => onSelect(presentation.address, presentation.matchedRecentAddress.ensName),
          disabled: presentation.isDisabled,
        },
        showFirstInteractionWarning,
      };
    case "valid-address":
      return {
        isVisible: true,
        showHeader: true,
        addressMatchedLabel,
        suggestion: {
          kind: "address-list-item",
          address: presentation.address,
          name: formattedAddress,
          onSelect: () => onSelect(presentation.address),
          hideDescription: true,
        },
        showFirstInteractionWarning,
      };
    case "disabled-address":
      return {
        isVisible: true,
        showHeader: true,
        addressMatchedLabel,
        suggestion: {
          kind: "address-list-item",
          address: presentation.address,
          name: formattedAddress,
          description: formattedAddress,
          disabled: true,
        },
        showFirstInteractionWarning,
      };
  }
}
