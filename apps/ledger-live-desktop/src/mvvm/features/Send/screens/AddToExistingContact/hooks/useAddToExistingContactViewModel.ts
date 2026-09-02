import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ContactId } from "@domain/entity-contact";
import { useContacts, useContactsMeContact } from "@features/platform-contacts";
import {
  useContactsSearchViewModel,
  type ContactsListViewLabels,
} from "@features/flow-contacts-list";
import type { AddNewContactHeaderState } from "LLD/features/Send/context/AddNewContactHeaderContext";
import { useSendPrefillAddAddressFlow } from "LLD/features/Send/hooks/useSendPrefillAddAddressFlow";
import { MY_WALLET_AVATAR_USER_URL } from "LLD/features/MyWallet/components/UserAvatar/constants";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { getSendFlowTrackingProperties } from "../../../utils/tracking";
import { track, trackPage } from "~/renderer/analytics/segment";

const SELECT_CONTACT_HEADER_STATE: AddNewContactHeaderState = {
  titleKey: "newSendFlow.addContact.selectContact",
  onAddressPhaseBack: null,
};

export function useAddToExistingContactViewModel() {
  const { t } = useTranslation();
  const contacts = useContacts();
  const meContact = useContactsMeContact();
  const { state } = useSendFlowData();
  const [searchQuery, setSearchQuery] = useState("");
  const { addressPhase, isOpeningAddressFlow, startForContact } = useSendPrefillAddAddressFlow({
    idleHeaderState: SELECT_CONTACT_HEADER_STATE,
    contactType: "existing",
  });

  const labels = useMemo(
    (): Pick<
      ContactsListViewLabels,
      "searchPlaceholder" | "searchNoResults" | "formatAddressCount" | "formatMeDisplayName"
    > => ({
      searchPlaceholder: t("contacts.searchPlaceholder"),
      searchNoResults: t("contacts.searchNoResults"),
      formatAddressCount: count => t("contacts.addressCount", { count }),
      formatMeDisplayName: name => t("contacts.detail.meDisplayName", { name }),
    }),
    [t],
  );

  const listViewModel = useContactsSearchViewModel(searchQuery, labels.formatMeDisplayName);
  const trackingProperties = useMemo(
    () => getSendFlowTrackingProperties(state.account.account, state.account.parentAccount),
    [state.account.account, state.account.parentAccount],
  );

  useEffect(() => {
    trackPage("Modal send - select existing contact", null, trackingProperties);
  }, [trackingProperties]);

  const onSearchInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  const onSelectContact = useCallback(
    (contactId: ContactId) => {
      const selectedContact =
        contacts.find(contact => contact.id === contactId) ??
        (meContact.id === contactId ? meContact : undefined);

      if (!selectedContact) {
        return;
      }

      track("button_clicked", {
        button: "contact",
        page: "select existing contact",
        ...trackingProperties,
      });
      void startForContact(selectedContact);
    },
    [contacts, meContact, startForContact, trackingProperties],
  );

  return {
    addressPhase,
    isOpeningAddressFlow,
    listViewModel,
    searchQuery,
    labels,
    meAvatarSrc: MY_WALLET_AVATAR_USER_URL,
    onSearchInputChange,
    onSelectContact,
  };
}
