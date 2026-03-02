import { Flex, IconBox, IconsLegacy, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import React, { FC } from "react";
import Button from "~/components/Button";
import DeviceActionModal from "~/components/DeviceActionModal";
import GenericErrorBottomModal from "~/components/GenericErrorBottomModal";
import QueuedDrawer from "~/components/QueuedDrawer";
import { Trans, useTranslation } from "~/context/Locale";
import { type TransferProposalAction } from "./types";
import {
  useDeviceAppModalViewModel,
  type DeviceAppModalViewModel,
} from "./useDeviceAppModalViewModel";

type Props = {
  isOpen: boolean;
  onConfirm: (deviceId: string) => Promise<void>;
  action: TransferProposalAction;
  appName: string;
  onClose?: () => void;
};

const translations = {
  action: {
    accept: "canton.pendingTransactions.accept",
    reject: "canton.pendingTransactions.reject",
    withdraw: "canton.pendingTransactions.withdraw",
  },
  successTitle: {
    accept: "canton.pendingTransactions.deviceAppModal.success.accept.title",
    reject: "canton.pendingTransactions.deviceAppModal.success.reject.title",
    withdraw: "canton.pendingTransactions.deviceAppModal.success.withdraw.title",
  },
  successDescription: {
    accept: "canton.pendingTransactions.deviceAppModal.success.accept.description",
    reject: "canton.pendingTransactions.deviceAppModal.success.reject.description",
    withdraw: "canton.pendingTransactions.deviceAppModal.success.withdraw.description",
  },
};

type ViewProps = DeviceAppModalViewModel & {
  isOpen: boolean;
  action: TransferProposalAction;
  onClose?: () => void;
};

export function View({
  confirmationState,
  error,
  request,
  device,
  actionConnect,
  handleDeviceResult,
  handleRetry,
  isOpen,
  action,
  onClose,
}: ViewProps) {
  const { t } = useTranslation();

  if (confirmationState === "completed") {
    return (
      <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose}>
        <Flex alignItems="center" py={4} px={6}>
          <IconBox
            Icon={IconsLegacy.CheckAloneMedium}
            color="success.c50"
            boxSize={64}
            iconSize={24}
          />
          <Text variant="h4" fontWeight="semiBold" mt={6} textAlign="center">
            {t(translations.successTitle[action])}
          </Text>
          <Text variant="body" color="neutral.c70" mt={8} textAlign="center">
            {t(translations.successDescription[action])}
          </Text>
          <Button type="main" onPress={onClose} mt={8} alignSelf="stretch">
            <Trans i18nKey="common.close" />
          </Button>
        </Flex>
      </QueuedDrawer>
    );
  }

  if (confirmationState === "error" && error) {
    return (
      <GenericErrorBottomModal
        error={error}
        onClose={onClose}
        footerButtons={
          <Button type="main" onPress={handleRetry} mt={4}>
            <Trans i18nKey="common.retry" />
          </Button>
        }
        hasExportLogButton
      />
    );
  }

  if (confirmationState === "confirming") {
    return (
      <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose}>
        <Flex alignItems="center" py={6}>
          <InfiniteLoader size={60} />
          <Text mt={4} variant="body" color="neutral.c80" textAlign="center">
            {t("canton.pendingTransactions.deviceAppModal.processing", {
              action,
            })}
          </Text>
        </Flex>
      </QueuedDrawer>
    );
  }

  if (!isOpen) {
    return null;
  }

  return (
    <DeviceActionModal
      action={actionConnect}
      device={device}
      request={request}
      onResult={handleDeviceResult}
      onClose={onClose}
      analyticsPropertyFlow="canton-pending"
    />
  );
}

const DeviceAppModal: FC<Props> = ({ isOpen, onConfirm, action, onClose, appName }) => {
  const viewModel = useDeviceAppModalViewModel({ isOpen, onConfirm, appName });
  return <View {...viewModel} isOpen={isOpen} action={action} onClose={onClose} />;
};

export default DeviceAppModal;
