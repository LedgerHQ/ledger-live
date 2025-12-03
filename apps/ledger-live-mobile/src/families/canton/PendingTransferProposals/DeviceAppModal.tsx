import React, { useCallback, useMemo, useState, useEffect, FC } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { Flex, Text, InfiniteLoader, IconBox, IconsLegacy } from "@ledgerhq/native-ui";
import DeviceActionModal from "~/components/DeviceActionModal";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import QueuedDrawer from "~/components/QueuedDrawer";
import GenericErrorBottomModal from "~/components/GenericErrorBottomModal";
import Button from "~/components/Button";
import { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { lastConnectedDeviceSelector } from "~/reducers/settings";

type Props = {
  isOpen: boolean;
  onConfirm: (deviceId: string) => Promise<void>;
  action: "accept" | "reject" | "withdraw";
  appName: string;
  onClose?: () => void;
};

type ConfirmationState = "pending" | "confirming" | "completed" | "error";

const translations = {
  title: {
    accept: "canton.pendingTransactions.deviceAppModal.success.accept.title",
    reject: "canton.pendingTransactions.deviceAppModal.success.reject.title",
    withdraw: "canton.pendingTransactions.deviceAppModal.success.withdraw.title",
  },
  description: {
    accept: "canton.pendingTransactions.deviceAppModal.success.accept.description",
    reject: "canton.pendingTransactions.deviceAppModal.success.reject.description",
    withdraw: "canton.pendingTransactions.deviceAppModal.success.withdraw.description",
  },
};

const DeviceAppModal: FC<Props> = ({ isOpen, onConfirm, action, onClose, appName }) => {
  const { t } = useTranslation();
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>("pending");
  const [error, setError] = useState<Error | null>(null);

  const actionConnect = useAppDeviceAction();
  const device = useSelector(lastConnectedDeviceSelector);

  const request = useMemo(
    () => ({
      appName,
    }),
    [appName],
  );

  useEffect(() => {
    if (isOpen) {
      setConfirmationState("pending");
      setError(null);
    }
  }, [isOpen]);

  const handleConfirm = useCallback(
    async (deviceId: string) => {
      try {
        setConfirmationState("confirming");
        await onConfirm(deviceId);
        setConfirmationState("completed");
      } catch (err) {
        setConfirmationState("error");
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [onConfirm],
  );

  const handleRetry = useCallback(() => {
    setConfirmationState("pending");
    setError(null);
  }, []);

  const handleDeviceResult = useCallback(
    (deviceResult: AppResult) => {
      if (deviceResult?.device) {
        let deviceId = deviceResult.device.deviceId;

        if (!deviceId || deviceId === "") {
          deviceId = deviceResult.device.wired ? "usb" : "ble";
        }

        handleConfirm(deviceId);
      }
    },
    [handleConfirm],
  );

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
            {t(translations.title[action])}
          </Text>
          <Text variant="body" color="neutral.c70" mt={8} textAlign="center">
            {t(translations.description[action])}
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
};

export default DeviceAppModal;
