import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  CONTACTS_EVENT_SOURCE,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
  CONTACTS_TRACKING_BUTTON,
  useContactsFeature,
} from "@features/flow-contacts";
import { useContextMenuClose } from "LLD/features/MyWallet/components/ContextMenuContext";
import { useContactsAnalytics } from "../../analytics";

export type ContactsButtonViewModel = {
  isEnabled: boolean;
  title: string;
  description: string;
  newBadgeLabel?: string;
  handleClick: () => void;
};

export function useContactsButtonViewModel(): ContactsButtonViewModel {
  const close = useContextMenuClose();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isEnabled, showNewBadge } = useContactsFeature("desktop");
  const analytics = useContactsAnalytics();

  const handleClick = useCallback(() => {
    analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.ENTRY,
      button: CONTACTS_TRACKING_BUTTON.contacts,
      page: CONTACTS_PAGE_PROPERTY.MY_WALLET,
    });
    navigate("/contacts");
    close();
  }, [analytics, close, navigate]);

  return {
    isEnabled,
    title: t("myWallet.contacts.title"),
    description: t("myWallet.contacts.description"),
    newBadgeLabel: showNewBadge ? t("common.new") : undefined,
    handleClick,
  };
}
