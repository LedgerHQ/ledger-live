import React from "react";
import { useTranslation } from "~/context/Locale";
import { HEDERA_DELEGATION_STATUS } from "@ledgerhq/live-common/families/hedera/constants";
import QueuedDrawer from "~/components/QueuedDrawer";

interface Props {
  status: HEDERA_DELEGATION_STATUS;
  error?: boolean;
  isOpen?: boolean;
  onClose(): void;
}

export function DelegationStatusModal({ status, error, isOpen, onClose }: Readonly<Props>) {
  const { t } = useTranslation();
  const statusKey = error ? "fetchError" : status;

  return (
    <QueuedDrawer
      isRequestingToBeOpened={!!isOpen}
      onClose={onClose}
      title={t(`hedera.delegatedPositions.details.status.${statusKey}`)}
      description={t(`hedera.delegatedPositions.details.status.${statusKey}Tooltip`)}
    />
  );
}
