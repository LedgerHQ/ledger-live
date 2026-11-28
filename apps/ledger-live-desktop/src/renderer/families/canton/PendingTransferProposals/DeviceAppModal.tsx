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
  const actionTitle = t(`families.canton.pendingTransactions.${action}`);

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
                  title={t(
                    `families.canton.pendingTransactions.deviceAppModal.success.${action}.title`,
                  )}
                  description={t(
                    `families.canton.pendingTransactions.deviceAppModal.success.${action}.description`,
                  )}
                />
              </Box>
            ) : confirmationState === "error" && error ? (
              <Box alignItems="center" py={4}>
                {error.name === "TransferOfferExpiredError" ? (
                  <ErrorDisplay error={error} />
                ) : (
                  <ErrorDisplay error={error} onRetry={handleRetry} withExportLogs />
                )}
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
                    action: actionTitle,
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
