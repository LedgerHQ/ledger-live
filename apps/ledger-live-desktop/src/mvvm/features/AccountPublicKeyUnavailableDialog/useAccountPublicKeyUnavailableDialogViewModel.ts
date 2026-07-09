import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import {
  closeAccountPublicKeyUnavailableDialog,
  selectIsAccountPublicKeyUnavailableDialogOpen,
} from "./accountPublicKeyUnavailableDialog";

export interface AccountPublicKeyUnavailableDialogViewProps {
  isOpen: boolean;
  title: string;
  description: string;
  ctaLabel: string;
  learnMoreLabel: string;
  onClose: () => void;
  onLearnMore: () => void;
}

const useAccountPublicKeyUnavailableDialogViewModel =
  (): AccountPublicKeyUnavailableDialogViewProps => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const isOpen = useSelector(selectIsAccountPublicKeyUnavailableDialogOpen);
    const supportUrl = useLocalizedUrl(urls.accountPublicKeyUnavailable);

    const onClose = useCallback(() => {
      dispatch(closeAccountPublicKeyUnavailableDialog());
    }, [dispatch]);

    const onLearnMore = useCallback(() => {
      openURL(supportUrl);
    }, [supportUrl]);

    return {
      isOpen,
      title: t("errors.AccountPublicKeyUnavailable.title"),
      description: t("errors.AccountPublicKeyUnavailable.description"),
      ctaLabel: t("common.ok"),
      learnMoreLabel: t("common.learnMore"),
      onClose,
      onLearnMore,
    };
  };

export default useAccountPublicKeyUnavailableDialogViewModel;
