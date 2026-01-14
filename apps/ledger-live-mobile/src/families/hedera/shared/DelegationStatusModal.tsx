import React from "react";
import { useTranslation } from "react-i18next";
import { HEDERA_DELEGATION_STATUS } from "@ledgerhq/live-common/families/hedera/constants";
import QueuedDrawer from "~/components/QueuedDrawer";

interface Props {
  status: HEDERA_DELEGATION_STATUS;
  isOpen?: boolean;
  onClose(): void;
}

export function DelegationStatusModal({ status, isOpen, onClose }: Readonly<Props>) {
  const { t } = useTranslation();

  return (
    <QueuedDrawer
      isRequestingToBeOpened={!!isOpen}
      onClose={onClose}
      title={t(`hedera.delegatedPositions.details.status.${status}`)}
      description={t(`hedera.delegatedPositions.details.status.${status}Tooltip`)}
    />
  );
}
