import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import BigNumber from "bignumber.js";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { derivePublicTransactionMode } from "@ledgerhq/live-common/families/aleo/utils";
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
  "record-picker": true,
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
          const { account, parentAccount } = data;
          const mainAccount = account ? getMainAccount(account, parentAccount) : null;
          const isTokenTx = account?.type === "TokenAccount";
          const defaultRecipient = mainAccount?.freshAddress ?? "";
          const defaultMode = derivePublicTransactionMode({ isTokenTx, isSelfTransfer: true });

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
                parentAccount: data.parentAccount,
                transaction: {
                  family: "aleo",
                  amount: new BigNumber(0),
                  useAllAmount: false,
                  recipient: defaultRecipient,
                  fees: new BigNumber(0),
                  mode: defaultMode,
                  ...(isTokenTx && data.account && { subAccountId: data.account.id }),
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
