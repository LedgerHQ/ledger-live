import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AssetCategory } from "@domain/api-aggregated-assets";
import type { Contact, ContactAddress } from "@domain/entity-contact";
import type { ContactAddressPickerProps } from "@features/flow-pay-contact";
import { useContacts } from "@features/platform-contacts";
import { useContactAddressPicker } from "LLM/features/Contacts/hooks/useContactAddressPicker";
import { useOpenSendFlow } from "LLM/features/Send/hooks/useOpenSendFlow";
import { NavigatorName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

export type UsePayTabNewPayment = Readonly<{
  open: (contact?: Contact) => void;
  contactAddressPicker: ContactAddressPickerProps;
}>;

export function usePayTabNewPayment(): UsePayTabNewPayment {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const contacts = useContacts();
  const { handleOpenSendFlow } = useOpenSendFlow({
    sourceScreenName: "Pay",
  });

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

  const openSendPage = useCallback(() => {
    const payContacts = contacts.filter(
      savedContact => !savedContact.isMe && savedContact.addresses.length > 0,
    );

    if (payContacts.length === 0) {
      handleOpenSendFlow({ categories: [AssetCategory.Stablecoins] });
      return;
    }

    navigation.navigate(NavigatorName.SendFlow, {
      params: { selectContactBeforeAccount: true },
    });
  }, [contacts, handleOpenSendFlow, navigation]);

  const open = useCallback(
    (nextContact?: Contact) => {
      if (!nextContact) {
        openSendPage();
        return;
      }

      openPicker(nextContact);
    },
    [openPicker, openSendPage],
  );

  return { open, contactAddressPicker };
}
