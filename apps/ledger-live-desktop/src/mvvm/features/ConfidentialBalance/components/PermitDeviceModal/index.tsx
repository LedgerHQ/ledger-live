import React from "react";
import { useTranslation } from "react-i18next";
import BigSpinner from "~/renderer/components/BigSpinner";
import Box from "~/renderer/components/Box";
import DeviceAction from "~/renderer/components/DeviceAction";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import Text from "~/renderer/components/Text";
import type { PermitDeviceSignature } from "../../hooks/usePermitSigner";
import {
  usePermitDeviceModalViewModel,
  type PermitDeviceModalViewModel,
} from "./usePermitDeviceModalViewModel";

export function PermitDeviceModalView({
  isOpen,
  isSigning,
  action,
  request,
  onResult,
  onClose,
}: PermitDeviceModalViewModel) {
  const { t } = useTranslation();

  return (
    <Modal
      isOpened={isOpen}
      onClose={onClose}
      centered
      width={500}
      backdropColor
      data-testid="confidential-permit-device-modal"
    >
      <ModalBody
        title={t("confidentialBalance.deviceModal.title")}
        onClose={onClose}
        render={() => (
          <Box p={6}>
            {isSigning ? (
              <Box alignItems="center" py={6}>
                <BigSpinner size={60} />
                <Text mt={4} fontSize={4} color="neutral.c80" textAlign="center">
                  {t("confidentialBalance.phase.signing")}
                </Text>
              </Box>
            ) : (
              <DeviceAction
                action={action}
                request={request}
                onResult={onResult}
                analyticsPropertyFlow="confidential-balance-permit"
              />
            )}
          </Box>
        )}
      />
    </Modal>
  );
}

export function PermitDeviceModal(props: PermitDeviceSignature) {
  return <PermitDeviceModalView {...usePermitDeviceModalViewModel(props)} />;
}
