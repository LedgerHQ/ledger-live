import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Contact } from "@domain/entity-contact";
import type { ContactsNativeProps } from "@features/flow-pay-contact";
import { useTranslation } from "@shared/i18n";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { usePayTabNewPayment } from "./usePayTabNewPayment";
import { usePayTabOutgoingOperations } from "./usePayTabOutgoingOperations";

export function usePayTabContacts(): ContactsNativeProps {
  const { t } = useTranslation();
  const { open } = usePayTabNewPayment();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const outgoingOperations = usePayTabOutgoingOperations();

  const onSeeAll = useCallback(() => {
    navigation.navigate(NavigatorName.MyWallet, {
      screen: ScreenName.MyWalletContacts,
      params: { title: t("payTab.contacts.seeAllTitle") },
    });
  }, [navigation, t]);
  const onContactPress = useCallback((contact: Contact) => open(contact), [open]);

  return useMemo(
    () => ({
      onPay: open,
      onContactPress,
      onSeeAll,
      outgoingOperations,
    }),
    [open, onContactPress, onSeeAll, outgoingOperations],
  );
}
