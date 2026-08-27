import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import { ScreenName } from "~/const";
import {
  CONTACTS_EVENT_SOURCE,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
  CONTACTS_TRACKING_BUTTON,
} from "@features/flow-contacts";
import { useContactsFeature } from "@features/platform-contacts";
import { useContactsAnalytics } from "../../analytics/useContactsAnalytics";

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
  const analytics = useContactsAnalytics();

  const handleClick = useCallback(() => {
    analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.ENTRY,
      button: CONTACTS_TRACKING_BUTTON.contacts,
      page: CONTACTS_PAGE_PROPERTY.MY_WALLET,
    });
    navigation.navigate(ScreenName.MyWalletContacts);
  }, [analytics, navigation]);

  return {
    isEnabled,
    title: t("myWallet.contacts.title"),
    description: t("myWallet.contacts.description"),
    newBadgeLabel: showNewBadge ? t("common.new") : undefined,
    handleClick,
  };
}
