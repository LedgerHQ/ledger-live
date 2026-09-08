import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Contact, ContactAddress } from "@domain/entity-contact";
import type { ContactAddressPickerProps } from "@features/flow-pay-contact";
import { useContactAddressPicker } from "LLM/features/Contacts/hooks/useContactAddressPicker";
import { useOpenSendFlow } from "LLM/features/Send/hooks/useOpenSendFlow";
import { ScreenName } from "~/const";
import type { PayTabNavigatorParamList } from "../types";

export type UsePayTabNewPayment = Readonly<{
  open: (contact?: Contact) => void;
  contactAddressPicker: ContactAddressPickerProps;
}>;

export function usePayTabNewPayment(): UsePayTabNewPayment {
  const navigation = useNavigation<NativeStackNavigationProp<PayTabNavigatorParamList>>();
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

  const open = useCallback(
    (nextContact?: Contact) => {
      if (!nextContact) {
        navigation.navigate(ScreenName.PayTabSelectContact);
        return;
      }

      openPicker(nextContact);
    },
    [openPicker, navigation],
  );

  return { open, contactAddressPicker };
}
