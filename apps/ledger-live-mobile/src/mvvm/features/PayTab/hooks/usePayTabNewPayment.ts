import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Contact, ContactAddress } from "@domain/entity-contact";
import type { ContactAddressPickerProps } from "@features/flow-pay-contact";
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
        navigation.navigate(NavigatorName.SendFlow, {
          params: { selectContactBeforeAccount: true },
        });
        return;
      }

      openPicker(nextContact);
    },
    [openPicker, navigation],
  );

  return { open, contactAddressPicker };
}
