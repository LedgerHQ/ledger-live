import React from "react";
import { useTranslation } from "react-i18next";
import QueuedDrawer from "~/components/QueuedDrawer";

interface Props {
  onClose(): void;
  isOpen?: boolean;
}

export function DisabledDelegationModal({ onClose, isOpen }: Readonly<Props>) {
  const { t } = useTranslation();

  return (
    <QueuedDrawer
      isRequestingToBeOpened={!!isOpen}
      onClose={onClose}
      title={t("hedera.delegation.alreadyDelegatedModal.title")}
      description={t("hedera.delegation.alreadyDelegatedModal.description")}
    />
  );
}
