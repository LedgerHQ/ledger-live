import React from "react";
import { useTranslation } from "react-i18next";
import { Toast } from "./Toast";

export const PtxToast = ({ onClose, isOpen }: { onClose(): void; isOpen?: boolean }) => {
  const { t } = useTranslation();
  if (isOpen) {
    return (
      <Toast
        id="ptx-services-ios-modal"
        type="success"
        onClose={onClose}
        title={t("notifications.ptxServices.toast.title")}
        icon="info"
      />
    );
  }
  return null;
};
