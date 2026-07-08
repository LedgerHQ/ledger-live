import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  closeAccountPublicKeyUnavailableDialog,
  selectIsAccountPublicKeyUnavailableDialogOpen,
} from "./accountPublicKeyUnavailableDialog";

export interface AccountPublicKeyUnavailableDialogViewProps {
  isOpen: boolean;
  title: string;
  description: string;
  ctaLabel: string;
  onClose: () => void;
}

const useAccountPublicKeyUnavailableDialogViewModel =
  (): AccountPublicKeyUnavailableDialogViewProps => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const isOpen = useSelector(selectIsAccountPublicKeyUnavailableDialogOpen);

    const onClose = useCallback(() => {
      dispatch(closeAccountPublicKeyUnavailableDialog());
    }, [dispatch]);

    return {
      isOpen,
      title: t("errors.AccountPublicKeyUnavailable.title"),
      description: t("errors.AccountPublicKeyUnavailable.description"),
      ctaLabel: t("common.ok"),
      onClose,
    };
  };

export default useAccountPublicKeyUnavailableDialogViewModel;
