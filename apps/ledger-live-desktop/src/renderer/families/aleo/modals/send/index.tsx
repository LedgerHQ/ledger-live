import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import BigNumber from "bignumber.js";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { useDispatch } from "LLD/hooks/redux";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import Modal from "~/renderer/components/Modal";
import { closeModal } from "~/renderer/actions/modals";
import AleoSendBody from "./Body";
import { AleoCustomModal } from "../../constants";
import type { StepId, ModalProps } from "./types";

interface Props extends ModalProps {
  name: AleoCustomModal;
}

const MODAL_LOCKED: Record<StepId, boolean> = {
  recipient: false,
  "private-sync": true,
  "record-picker": true,
  amount: true,
  summary: true,
  device: true,
  confirmation: true,
};

const AleoSendModal = ({ name, stepId: initialStepId, onClose }: Props) => {
  const { t } = useTranslation();
  const [stepId, setStepId] = React.useState<StepId>(() => initialStepId || "recipient");
  const handleReset = useCallback(() => setStepId("recipient"), []);
  const handleStepChange = useCallback((stepId: StepId) => setStepId(stepId), []);
  const dispatch = useDispatch();

  const handleModalClose = useCallback(() => {
    dispatch(closeModal(name));
    onClose?.();
  }, [name, dispatch, onClose]);

  const isModalLocked = MODAL_LOCKED[stepId];
  const isSelfTransfer = name === AleoCustomModal.SELF_TRANSFER;
  const title = isSelfTransfer ? t("aleo.selfTransfer.modal.title") : t("send.title");

  return (
    <DomainServiceProvider>
      <Modal
        name={name}
        centered
        onHide={handleReset}
        onClose={handleModalClose}
        preventBackdropClick={isModalLocked}
        render={({ onClose, data }) => {
          const mainAccount = data.account
            ? getMainAccount(data.account, data.parentAccount)
            : null;

          const defaultRecipient = isSelfTransfer ? mainAccount?.freshAddress : null;
          const defaultTransactionMode = isSelfTransfer
            ? TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE
            : TRANSACTION_TYPE.TRANSFER_PUBLIC;

          return (
            <AleoSendBody
              title={title}
              modalName={name}
              stepId={stepId}
              onClose={onClose}
              onChangeStepId={handleStepChange}
              params={{
                account: data.account,
                transaction: {
                  family: "aleo",
                  amount: new BigNumber(0),
                  useAllAmount: false,
                  recipient: defaultRecipient ?? "",
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

export default AleoSendModal;
