import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Contact } from "@domain/entity-contact";
import { useTranslation } from "@shared/i18n";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useHideTabBar } from "LLM/hooks/useTabBarVisibility";
import { usePayTabNewPayment } from "../../hooks/usePayTabNewPayment";

export function usePaySelectContactViewModel() {
  useHideTabBar();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const { open, contactAddressPicker } = usePayTabNewPayment();
  const title = t("payTab.contacts.seeAllTitle");

  const onSelectContact = useCallback(
    (contact: Contact) => {
      if (contact.isMe) {
        navigation.navigate(NavigatorName.MyWallet, {
          screen: ScreenName.MyWalletContactDetail,
          params: { contactId: contact.id },
        });
        return;
      }

      open(contact);
    },
    [navigation, open],
  );

  return {
    title,
    onSelectContact,
    contactAddressPicker,
  };
}
