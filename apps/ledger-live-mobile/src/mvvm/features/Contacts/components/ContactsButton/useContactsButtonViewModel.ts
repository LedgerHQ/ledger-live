import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import { ScreenName } from "~/const";
import { track } from "~/analytics";
import { useContactsFeature } from "@features/flow-contacts/featureFlags";
import {
  MY_WALLET_TRACKING_BUTTON,
  MY_WALLET_TRACKING_PAGE_NAME,
} from "LLM/features/MyWallet/constants";

export type ContactsButtonViewModel = {
  isEnabled: boolean;
  title: string;
  description: string;
  newBadgeLabel?: string;
  handleClick: () => void;
};

export function useContactsButtonViewModel(): ContactsButtonViewModel {
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();
  const { t } = useTranslation();
  const { isEnabled, showNewBadge } = useContactsFeature("mobile");

  const handleClick = useCallback(() => {
    track("button_clicked", {
      button: MY_WALLET_TRACKING_BUTTON.contacts,
      page: MY_WALLET_TRACKING_PAGE_NAME,
    });
    navigation.navigate(ScreenName.MyWalletContacts);
  }, [navigation]);

  return {
    isEnabled,
    title: t("myWallet.contacts.title"),
    description: t("myWallet.contacts.description"),
    newBadgeLabel: showNewBadge ? t("common.new") : undefined,
    handleClick,
  };
}
