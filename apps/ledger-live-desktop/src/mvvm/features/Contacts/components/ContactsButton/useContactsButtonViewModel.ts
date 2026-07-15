import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useContactsFeature } from "@features/flow-contacts/featureFlags";
import { track } from "~/renderer/analytics/segment";
import { useContextMenuClose } from "LLD/features/MyWallet/components/ContextMenuContext";
import {
  MY_WALLET_TRACKING_BUTTON,
  MY_WALLET_TRACKING_PAGE_NAME,
} from "LLD/features/MyWallet/constants";

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

  const handleClick = useCallback(() => {
    track("button_clicked", {
      button: MY_WALLET_TRACKING_BUTTON.contacts,
      page: MY_WALLET_TRACKING_PAGE_NAME,
    });
    navigate("/contacts");
    close();
  }, [close, navigate]);

  return {
    isEnabled,
    title: t("myWallet.contacts.title"),
    description: t("myWallet.contacts.description"),
    newBadgeLabel: showNewBadge ? t("common.new") : undefined,
    handleClick,
  };
}
