import React from "react";
import { useTranslation } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import Modal from "~/renderer/components/Modal";
import ModalBody from "~/renderer/components/Modal/ModalBody";

export type Props = {
  isOpened: boolean;
  isDanger?: boolean;
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  desc?: React.ReactNode;
  renderIcon?: () => React.ReactNode;
  confirmText?: React.ReactNode;
  cancelText?: React.ReactNode;
  onReject?: () => void;
  onClose?: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  analyticsName: string;
  cancellable?: boolean;
  centered?: boolean;
  children?: React.ReactNode;
  narrow?: boolean;
};

const ConfirmModal = ({
  cancellable,
  isOpened,
  title,
  subTitle,
  desc,
  confirmText,
  cancelText,
  isDanger,
  onReject,
  onConfirm,
  isLoading,
  renderIcon,
  onClose,
  analyticsName,
  centered,
  children,
  narrow,
  ...props
}: Props) => {
  const { t } = useTranslation();
  const realConfirmText = confirmText || t("common.confirm");
  const realCancelText = cancelText || t("common.cancel");
  return (
    <Modal
      name="MODAL_CONFIRM"
      isOpened={isOpened}
      centered={centered}
      width={narrow ? 380 : undefined}
      onClose={!cancellable && isLoading ? undefined : onClose}
      preventBackdropClick={isLoading}
      backdropColor
    >
      <ModalBody
        {...props}
        onClose={!cancellable && isLoading ? undefined : onClose}
        title={title}
        renderFooter={() => (
          <Box horizontal alignItems="center" justifyContent="flex-end" flow={2}>
            {!isLoading && onReject && (
              <Button onClick={onReject} data-testid="modal-cancel-button">
                {realCancelText}
              </Button>
            )}
            <Button
              onClick={onConfirm}
              primary={!isDanger}
              danger={isDanger}
              isLoading={isLoading}
              disabled={isLoading}
              data-testid="modal-confirm-button"
            >
              {realConfirmText}
            </Button>
          </Box>
        )}
        render={() => (
          <Box>
            {subTitle && (
              <Box ff="Inter|Regular" color="neutral.c100" textAlign="center" mb={2} mt={3}>
                {subTitle}
              </Box>
            )}
            {renderIcon && (
              <Box justifyContent="center" alignItems="center" mt={4} mb={3}>
                {renderIcon()}
              </Box>
            )}
            {desc && (
              <Box ff="Inter" color="neutral.c80" fontSize={4} textAlign="center">
                {desc}
              </Box>
            )}
            {children}
          </Box>
        )}
      />
      <TrackPage category="Modal" name={analyticsName} />
    </Modal>
  );
};
export default ConfirmModal;
