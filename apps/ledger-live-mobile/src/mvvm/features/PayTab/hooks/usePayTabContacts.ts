import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Contact } from "@domain/entity-contact";
import type { ContactsNativeProps } from "@features/flow-pay-contact";
import { useTranslation } from "@shared/i18n";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { usePayTabOutgoingOperations } from "./usePayTabOutgoingOperations";

export function usePayTabContacts(open: (contact?: Contact) => void): ContactsNativeProps {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const outgoingOperations = usePayTabOutgoingOperations();

  const openPayContactList = useCallback(() => {
    navigation.navigate(NavigatorName.MyWallet, {
      screen: ScreenName.MyWalletContacts,
      params: { title: t("payTab.contacts.seeAllTitle") },
    });
  }, [navigation, t]);
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
