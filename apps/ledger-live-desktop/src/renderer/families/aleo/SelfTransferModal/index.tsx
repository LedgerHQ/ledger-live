import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import BigNumber from "bignumber.js";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { useDispatch } from "LLD/hooks/redux";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import Modal from "~/renderer/components/Modal";
import DefaultSendBody from "~/renderer/modals/Send/Body";
import type { StepId } from "~/renderer/modals/Send/types";
import { closeModal } from "~/renderer/actions/modals";
import { AleoCustomModal } from "../constants";

type Props = {
  stepId?: StepId;
  onClose?: () => void;
};

const MODAL_LOCKED: Record<StepId, boolean> = {
  recipient: false,
  amount: true,
  summary: true,
  device: true,
  confirmation: true,
  warning: false,
};

const SelfTransferModal = ({ stepId: initialStepId, onClose }: Props) => {
  const { t } = useTranslation();
  const [stepId, setStepId] = React.useState<StepId>(() => initialStepId || "recipient");
  const handleReset = useCallback(() => setStepId("recipient"), []);
  const handleStepChange = useCallback((stepId: StepId) => setStepId(stepId), []);
  const isModalLocked = MODAL_LOCKED[stepId];
  const dispatch = useDispatch();

  const handleModalClose = useCallback(() => {
    dispatch(closeModal(AleoCustomModal.SELF_TRANSFER));
    onClose?.();
  }, [dispatch, onClose]);

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

          return (
            <DefaultSendBody
              stepId={stepId}
              onClose={onClose}
              onChangeStepId={handleStepChange}
              params={{
                title: t("aleo.selfTransfer.modal.title"),
                account: data.account,
                transaction: {
                  family: "aleo",
                  amount: new BigNumber(0),
                  useAllAmount: false,
                  recipient: mainAccount?.freshAddress ?? "",
                  fees: new BigNumber(0),
                  mode: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE,
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
