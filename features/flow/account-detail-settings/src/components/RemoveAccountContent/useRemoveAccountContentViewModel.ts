import { useCallback } from "react";
import { useTranslation } from "@shared/i18n";
import type { RemoveAccountContentProps, RemoveAccountContentViewProps } from "./types";

export function useRemoveAccountContentViewModel({
  onConfirm,
  onCancel,
  onEvent,
}: RemoveAccountContentProps): RemoveAccountContentViewProps {
  const { t } = useTranslation();

  const handleConfirm = useCallback(() => {
    onEvent?.("validateRemove");
    onConfirm();
  }, [onConfirm, onEvent]);

  const handleCancel = useCallback(() => {
    onEvent?.("cancelRemove");
    onCancel();
  }, [onCancel, onEvent]);

  return {
    labels: {
      title: t("accountDetailSettings.remove.title"),
      description: t("accountDetailSettings.remove.description"),
      confirm: t("accountDetailSettings.remove.confirm"),
      cancel: t("accountDetailSettings.remove.cancel"),
    },
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  };
}
