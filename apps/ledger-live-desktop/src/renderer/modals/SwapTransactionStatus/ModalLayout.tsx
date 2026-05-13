import React from "react";
import { useTranslation } from "react-i18next";
import { IconButton } from "@ledgerhq/lumen-ui-react";
import { Close } from "@ledgerhq/lumen-ui-react/symbols";

interface Props {
  children: React.ReactNode;
  onClose: () => void;
}

export function ModalLayout({ children, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col bg-base">
      <div className="flex justify-end p-16">
        <IconButton
          aria-label={t("swap2.modals.transactionStatus.accessibility.close")}
          icon={Close}
          onClick={onClose}
          size="sm"
          appearance="transparent"
        />
      </div>
      <div className="flex flex-col px-24 pb-24 pt-12 gap-24">{children}</div>
    </div>
  );
}
