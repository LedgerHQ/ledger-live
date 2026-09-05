import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Contact } from "@domain/entity-contact";
import type { ContactsNativeProps } from "@features/flow-pay-contact";
import { ScreenName } from "~/const";
import type { PayTabNavigatorParamList } from "../types";
import { usePayTabOutgoingOperations } from "./usePayTabOutgoingOperations";

export function usePayTabContacts(open: (contact?: Contact) => void): ContactsNativeProps {
  const navigation = useNavigation<NativeStackNavigationProp<PayTabNavigatorParamList>>();
  const outgoingOperations = usePayTabOutgoingOperations();

  const openPayContactList = useCallback(() => {
    navigation.navigate(ScreenName.PayTabSelectContact);
  }, [navigation]);
  const onPay = useCallback(() => open(), [open]);
  const onContactPress = useCallback((contact: Contact) => open(contact), [open]);

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
