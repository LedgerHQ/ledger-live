import React, { useCallback, useMemo, useState, useEffect, FC } from "react";
import { useTranslation } from "react-i18next";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import DeviceAction from "~/renderer/components/DeviceAction";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import BigSpinner from "~/renderer/components/BigSpinner";
import Text from "~/renderer/components/Text";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";
import { CONNECTION_TYPES } from "~/renderer/analytics/hooks/variables";
import type { TransferProposalAction } from "./types";

type Props = {
  isOpen: boolean;
  onConfirm: (deviceId: string) => Promise<void>;
  action: TransferProposalAction;
  appName: string;
  onClose?: () => void;
};

type ConfirmationState = "pending" | "confirming" | "completed" | "error";

const translations = {
  title: {
    accept: "families.canton.pendingTransactions.deviceAppModal.success.accept.title",
    reject: "families.canton.pendingTransactions.deviceAppModal.success.reject.title",
    withdraw: "families.canton.pendingTransactions.deviceAppModal.success.withdraw.title",
  },
  description: {
    accept: "families.canton.pendingTransactions.deviceAppModal.success.accept.description",
    reject: "families.canton.pendingTransactions.deviceAppModal.success.reject.description",
    withdraw: "families.canton.pendingTransactions.deviceAppModal.success.withdraw.description",
  },
};

const DeviceAppModal: FC<Props> = ({ isOpen, onConfirm, action, onClose, appName }) => {
  const { t } = useTranslation();
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>("pending");
  const [error, setError] = useState<Error | null>(null);

  const actionConnect = useConnectAppAction();
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

  const actionTitle = useMemo(() => {
    return action.toUpperCase().slice(0, 1) + action.slice(1);
  }, [action]);

  return (
    <Modal
      isOpened={isOpen}
      onClose={onClose}
      centered
      width={500}
      backdropColor
      data-testid="canton-offer-action-modal"
    >
      <ModalBody
        title={t("families.canton.pendingTransactions.deviceAppModal.title", {
          action: actionTitle,
        })}
        onClose={onClose}
        render={() => (
          <Box
            p={6}
            style={{
              minWidth: "400px",
              maxWidth: "500px",
            }}
          >
            {confirmationState === "completed" ? (
              <Box alignItems="center" py={4}>
                <SuccessDisplay
                  title={t(translations.title[action])}
                  description={t(translations.description[action])}
                />
              </Box>
            ) : confirmationState === "error" && error ? (
              <Box alignItems="center" py={4}>
                <ErrorDisplay error={error} onRetry={handleRetry} withExportLogs />
              </Box>
            ) : confirmationState === "confirming" ? (
              <Box alignItems="center" py={6}>
                <BigSpinner size={60} />
                <Text
                  mt={4}
                  fontSize={4}
                  color="palette.text.shade80"
                  textAlign="center"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {t("families.canton.pendingTransactions.deviceAppModal.processing", {
                    action,
                  })}
                </Text>
              </Box>
            ) : (
              <DeviceAction
                action={actionConnect}
                request={request}
                onResult={async result => {
                  if (result) {
                    let deviceId = result?.device?.deviceId;

                    if (!deviceId || deviceId === "") {
                      deviceId = result.device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE;
                    }

                    await handleConfirm(deviceId);
                  }
                }}
                analyticsPropertyFlow="canton-pending"
              />
            )}
          </Box>
        )}
      />
    </Modal>
  );
};

export default DeviceAppModal;
