import React, { FC } from "react";
import { useTranslation } from "react-i18next";
import BigSpinner from "~/renderer/components/BigSpinner";
import Box from "~/renderer/components/Box";
import DeviceAction from "~/renderer/components/DeviceAction";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import Text from "~/renderer/components/Text";
import type { TransferProposalAction } from "./types";
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
    accept: "families.canton.pendingTransactions.accept",
    reject: "families.canton.pendingTransactions.reject",
    withdraw: "families.canton.pendingTransactions.withdraw",
  },
  successTitle: {
    accept: "families.canton.pendingTransactions.deviceAppModal.success.accept.title",
    reject: "families.canton.pendingTransactions.deviceAppModal.success.reject.title",
    withdraw: "families.canton.pendingTransactions.deviceAppModal.success.withdraw.title",
  },
  successDescription: {
    accept: "families.canton.pendingTransactions.deviceAppModal.success.accept.description",
    reject: "families.canton.pendingTransactions.deviceAppModal.success.reject.description",
    withdraw: "families.canton.pendingTransactions.deviceAppModal.success.withdraw.description",
  },
};

export function View({
  confirmationState,
  error,
  request,
  actionConnect,
  handleDeviceResult,
  handleRetry,
  isOpen,
  action,
  onClose,
}: DeviceAppModalViewModel) {
  const { t } = useTranslation();
  const actionTitle = t(translations.action[action]);

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
                  title={t(translations.successTitle[action])}
                  description={t(translations.successDescription[action])}
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
                  color="neutral.c80"
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
                onResult={handleDeviceResult}
                analyticsPropertyFlow="canton-pending"
              />
            )}
          </Box>
        )}
      />
    </Modal>
  );
}

const DeviceAppModal: FC<Props> = ({ isOpen, onConfirm, action, onClose, appName }) => {
  return <View {...useDeviceAppModalViewModel({ isOpen, onConfirm, action, appName, onClose })} />;
};

export default DeviceAppModal;
