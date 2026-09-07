import { useCallback, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Contact, ContactAddress } from "@domain/entity-contact";
import { useContacts } from "@features/platform-contacts";
import type { ContactAddressPickerProps } from "@features/flow-pay-contact";
import { useContactAddressPicker } from "LLM/features/Contacts/hooks/useContactAddressPicker";
import { useOpenSendFlow } from "LLM/features/Send/hooks/useOpenSendFlow";
import { useHideTabBar } from "LLM/hooks/useTabBarVisibility";
import type { PayTabNavigatorParamList } from "../../types";

export type PayTabSelectContactViewModel = Readonly<{
  searchValue: string;
  setSearchValue: (value: string) => void;
  clearSearch: () => void;
  contacts: readonly Contact[];
  showEmptyContactsState: boolean;
  handleBack: () => void;
  handleContactSelect: (contact: Contact) => void;
  contactAddressPicker: ContactAddressPickerProps;
}>;

export function usePayTabSelectContactViewModel(): PayTabSelectContactViewModel {
  useHideTabBar();
  const navigation = useNavigation<NativeStackNavigationProp<PayTabNavigatorParamList>>();
  const storedContacts = useContacts();
  const { handleOpenSendFlow } = useOpenSendFlow({ sourceScreenName: "Pay" });
  const [searchValue, setSearchValue] = useState("");

  const payFromAddress = useCallback(
    (address: ContactAddress) => {
      handleOpenSendFlow({
        currencyIds: [address.currencyId],
        recipient: address.address,
        skipRecipientStep: true,
      });
    },
    [handleOpenSendFlow],
  );
  const { open: openPicker, contactAddressPicker } = useContactAddressPicker({
    onSelectAddress: payFromAddress,
  });
  const clearSearch = useCallback(() => setSearchValue(""), []);
  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const query = searchValue.trim().toLowerCase();
  const contacts = storedContacts
    .filter(contact => !contact.isMe)
    .filter(contact => !query || contact.name.toLowerCase().includes(query));

  return {
    searchValue,
    setSearchValue,
    clearSearch,
    contacts,
    showEmptyContactsState: searchValue.length === 0 && contacts.length === 0,
    handleBack,
    handleContactSelect: openPicker,
    contactAddressPicker,
  };
}
