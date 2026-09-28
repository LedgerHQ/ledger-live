import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Contact } from "@domain/entity-contact";
import type { ContactsNativeProps } from "@features/flow-pay-contact";
import { trackButtonClicked } from "@features/platform-pay-analytics";
import { ScreenName } from "~/const";
import type { PayTabNavigatorParamList } from "../types";
import { useOutgoingContactOperations } from "LLM/features/Contacts/hooks/useOutgoingContactOperations";

export function usePayTabContacts(open: (contact?: Contact) => void): ContactsNativeProps {
  const navigation = useNavigation<NativeStackNavigationProp<PayTabNavigatorParamList>>();
  const outgoingOperations = useOutgoingContactOperations();

  const openPayContactList = useCallback(() => {
    navigation.navigate(ScreenName.PayTabPayContact);
  }, [navigation]);
  const onPay = useCallback(() => {
    trackButtonClicked({ button: "send", buttonLocation: "contacts", page: "Pay" });
    open();
  }, [open]);
  const onContactPress = useCallback(
    (contact: Contact) => {
      trackButtonClicked({
        button: "send to contact",
        buttonLocation: "contacts",
        page: "Pay",
      });
      open(contact);
    },
    [open],
  );

  return useMemo(
    () => ({
      onPay,
      onContactPress,
      onSeeAll: openPayContactList,
      outgoingOperations,
    }),
    [onContactPress, onPay, openPayContactList, outgoingOperations],
  );
}
