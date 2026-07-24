import { useLayoutEffect, useMemo } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  type ContactDetailLabels,
  type ContactDetailViewProps,
  useContactsFeature,
  useEmptyContactDetail,
} from "@features/flow-contacts";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { USER_AVATAR_URL } from "LLM/components/UserAvatar/constants";
import type { MyWalletNavigatorStackParamList } from "LLM/features/MyWallet/types";

type ContactDetailScreenViewModel =
  | Readonly<{ status: "redirecting" }>
  | Readonly<{
      status: "ready";
      pageProps: ContactDetailViewProps;
    }>;

const onAddAddress = () => undefined;

export function useContactDetailScreenViewModel(): ContactDetailScreenViewModel {
  const navigation = useNavigation<NativeStackNavigationProp<MyWalletNavigatorStackParamList>>();
  const route =
    useRoute<RouteProp<MyWalletNavigatorStackParamList, typeof ScreenName.MyWalletContactDetail>>();
  const { isEnabled } = useContactsFeature("mobile");
  const { t } = useTranslation();
  const contact = useEmptyContactDetail(route.params.contactId);
  const labels = useMemo<ContactDetailLabels>(
    () => ({
      addAddress: t("contacts.addAddress"),
      emptyMeTitle: t("contacts.detail.emptyState.title"),
      emptyContactTitle: () => t("contacts.detail.emptyState.title"),
      emptyMeDescription: t("contacts.detail.emptyState.meDescription"),
      emptyContactDescription: name => t("contacts.detail.emptyState.contactDescription", { name }),
      formatAddressCount: count => t("contacts.addressCount", { count }),
    }),
    [t],
  );
  const shouldRedirect = !isEnabled || !contact;

  useLayoutEffect(() => {
    if (shouldRedirect) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace(ScreenName.MyWallet);
      }
    }
  }, [navigation, shouldRedirect]);

  if (shouldRedirect) {
    return { status: "redirecting" };
  }

  return {
    status: "ready",
    pageProps: {
      contact,
      labels,
      meAvatarSrc: USER_AVATAR_URL,
      onAddAddress,
    },
  };
}
