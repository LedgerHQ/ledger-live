import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import BigNumber from "bignumber.js";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { useDispatch } from "LLD/hooks/redux";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import Modal from "~/renderer/components/Modal";
import DefaultSendBody from "~/renderer/modals/Send/Body";
import { closeModal } from "~/renderer/actions/modals";
import { AleoCustomModal } from "../constants";
import type { ModalProps, StepId } from "../modals/send/types";

const MODAL_LOCKED: Record<StepId, boolean> = {
  recipient: false,
  "private-sync": true,
  amount: true,
  summary: true,
  device: true,
  confirmation: true,
};

const SelfTransferModal = ({ stepId: initialStepId, onClose }: ModalProps) => {
  const { t } = useTranslation();
  const [stepId, setStepId] = React.useState<StepId>(() => initialStepId || "recipient");
  const handleReset = useCallback(() => setStepId("recipient"), []);
  const handleStepChange = useCallback((stepId: StepId) => setStepId(stepId), []);
  const dispatch = useDispatch();

  const handleModalClose = useCallback(() => {
    dispatch(closeModal(AleoCustomModal.SELF_TRANSFER));
    onClose?.();
  }, [dispatch, onClose]);

  const isModalLocked = MODAL_LOCKED[stepId];

  return (
    <DomainServiceProvider>
      <Modal
        name={AleoCustomModal.SELF_TRANSFER}
        centered
        onHide={handleReset}
        onClose={handleModalClose}
        preventBackdropClick={isModalLocked}
        render={({ onClose, data }) => {
          const mainAccount = data.account
            ? getMainAccount(data.account, data.parentAccount)
            : null;

          const defaultRecipient = mainAccount?.freshAddress ?? "";
          const defaultTransactionMode = TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE;

          return (
            <DefaultSendBody
              title={t("aleo.selfTransfer.modal.title")}
              modalName={AleoCustomModal.SELF_TRANSFER}
              onClose={onClose}
              // @ts-expect-error - there is no easy way to add custom steps yet
              stepId={stepId}
              // @ts-expect-error - there is no easy way to add custom steps yet
              onChangeStepId={handleStepChange}
              params={{
                account: data.account,
                transaction: {
                  family: "aleo",
                  amount: new BigNumber(0),
                  useAllAmount: false,
                  recipient: defaultRecipient,
                  fees: new BigNumber(0),
                  mode: defaultTransactionMode,
                },
              }}
            />
          );
        }}
      />
    </DomainServiceProvider>
  );
};

export default SelfTransferModal;
