import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ContactsNativeProps } from "@features/flow-pay-contact";
import { useTranslation } from "~/context/Locale";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { usePayTabNewPayment } from "./usePayTabNewPayment";

export function usePayTabContacts(): ContactsNativeProps {
  const { t } = useTranslation();
  const { open } = usePayTabNewPayment();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();

  const onSeeAll = useCallback(() => {
    navigation.navigate(NavigatorName.MyWallet, {
      screen: ScreenName.MyWalletContacts,
      params: { title: t("payTab.contacts.seeAllTitle") },
    });
  }, [navigation, t]);

  return useMemo(
    () => ({
      title: t("payTab.contacts.title"),
      payLabel: t("payTab.contacts.pay"),
      onPay: open,
      onSeeAll,
    }),
    [t, open, onSeeAll],
  );
}
