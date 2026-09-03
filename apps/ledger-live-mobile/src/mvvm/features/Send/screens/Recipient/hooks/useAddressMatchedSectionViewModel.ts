import { getRecipientMatchPresentation } from "@ledgerhq/live-common/flows/send/recipient/utils/getRecipientMatchPresentation";
import type {
  AddressSearchResult,
  MatchedAccount,
  MatchedContact,
  RecentAddress,
} from "@ledgerhq/live-common/flows/send/recipient/types";
import { SEND_ADDRESS_FORMAT_OPTIONS } from "@ledgerhq/live-common/flows/send/utils";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { useFeature } from "@features/platform-feature-flags";
import { useTranslation } from "~/context/Locale";
import { useFormatRelativeDate } from "./useFormatRelativeDate";

type UseAddressMatchedSectionViewModelProps = Readonly<{
  searchResult: AddressSearchResult;
  searchValue: string;
  onSelect: (address: string, ensName?: string) => void;
  isSanctioned?: boolean;
  isAddressComplete?: boolean;
  hasBridgeError?: boolean;
  isContactsFeatureEnabled?: boolean;
  hasAddressBook?: boolean;
  addressBookFamilyName?: string;
  onAddContact?: () => void;
  onUnsupportedNetwork?: () => void;
  onDismissUnsupportedNetwork?: () => void;
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

type MatchedLedgerAccountsSuggestion = Readonly<{
  kind: "matched-ledger-accounts";
  address: string;
  matchedAccounts: readonly MatchedAccount[];
  matchedRecentAddress: RecentAddress | undefined;
  isDisabled: boolean;
  onSelect: (address: string) => void;
}>;

type RecipientCardSuggestion = Readonly<{
  kind: "recipient-card";
  recipient: string;
  description?: string;
  contact?: MatchedContact;
  isReady: boolean;
  showActions: boolean;
  hasAddressBook: boolean;
  addressBookUnsupportedTitle: string;
  addressBookUnsupportedDescription: string;
  addContactLabel: string;
  sendLabel: string;
  onAddContact: () => void;
  onSend: () => void;
  onUnsupportedNetwork: () => void;
  onDismissUnsupportedNetwork: () => void;
}>;

export type AddressMatchedSectionViewModel = Readonly<{
  isVisible: boolean;
  showHeader: boolean;
  addressMatchedLabel: string;
  suggestion:
    | AddressListItemSuggestion
    | MatchedLedgerAccountsSuggestion
    | RecipientCardSuggestion
    | null;
  showFirstInteractionWarning: boolean;
}>;

export function useAddressMatchedSectionViewModel({
  searchResult,
  searchValue,
  onSelect,
  isSanctioned = false,
  isAddressComplete = false,
  hasBridgeError = false,
  isContactsFeatureEnabled = false,
  hasAddressBook = false,
  addressBookFamilyName = "",
  onAddContact = () => undefined,
  onUnsupportedNetwork = () => undefined,
  onDismissUnsupportedNetwork = () => undefined,
}: UseAddressMatchedSectionViewModelProps): AddressMatchedSectionViewModel {
  const { t } = useTranslation();
  const formatRelativeDate = useFormatRelativeDate();
  const isFirstInteractionBannerEnabled =
    useFeature("newSendFlowFirstInteractionBanner")?.enabled ?? false;
  const addressMatchedLabel = t("send.newSendFlow.addressMatched");
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
        addressBookUnsupportedTitle: t("send.newSendFlow.addressBookUnsupported.title", {
          family: addressBookFamilyName,
        }),
        addressBookUnsupportedDescription: t(
          "send.newSendFlow.addressBookUnsupported.description",
          { family: addressBookFamilyName },
        ),
        addContactLabel: t("contacts.addContact"),
        sendLabel: t("contacts.addressDetail.send"),
        onAddContact,
        onSend: () => onSelect(recipientAddress, searchResult.ensName),
        onUnsupportedNetwork,
        onDismissUnsupportedNetwork,
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

    return t("send.newSendFlow.alreadyUsed", {
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
          addressBookUnsupportedTitle: t("send.newSendFlow.addressBookUnsupported.title", {
            family: addressBookFamilyName,
          }),
          addressBookUnsupportedDescription: t(
            "send.newSendFlow.addressBookUnsupported.description",
            { family: addressBookFamilyName },
          ),
          addContactLabel: t("contacts.addContact"),
          sendLabel: t("contacts.addressDetail.send"),
          onAddContact,
          onSend: () => onSelect(presentation.recipientAddress, presentation.ensName),
          onUnsupportedNetwork,
          onDismissUnsupportedNetwork,
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
          kind: "matched-ledger-accounts",
          address: presentation.address,
          matchedAccounts: presentation.matchedAccounts,
          matchedRecentAddress: presentation.matchedRecentAddress,
          isDisabled: presentation.isDisabled,
          onSelect: (address: string) =>
            onSelect(address, presentation.matchedRecentAddress?.ensName),
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
          description: t("send.newSendFlow.notInRecentHistory"),
          onSelect: () => onSelect(presentation.address),
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
