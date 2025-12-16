import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";
import { useDispatch } from "react-redux";
import { setMemoTagInfoBoxDisplay } from "~/renderer/actions/UI";
import { closeModal } from "~/renderer/actions/modals";
import { isModalOpened, getModalData } from "~/renderer/reducers/modals";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { openSendFlowDialog } from "~/renderer/reducers/sendFlow";
import type { State } from "~/renderer/reducers";

type Props = {
  stepId?: StepId;
  onClose?: () => void;
};
const MODAL_LOCKED: {
  [key in StepId]: boolean;
} = {
  recipient: false,
  amount: true,
  summary: true,
  device: true,
  confirmation: true,
  warning: false,
};
const SendModal = ({ stepId: initialStepId, onClose }: Props) => {
  const [stepId, setStep] = useState<StepId>(() => initialStepId || "recipient");
  const handleReset = useCallback(() => setStep("recipient"), []);
  const handleStepChange = useCallback((stepId: StepId) => setStep(stepId), []);
  const isModalLocked = MODAL_LOCKED[stepId];
  const dispatch = useDispatch();

  const newSendFlow = useFeature("newSendFlow");
  const isOpened = useSelector((state: State) => isModalOpened(state, "MODAL_SEND"));
  const modalData = useSelector((state: State) => getModalData(state, "MODAL_SEND"));

  const handleModalClose = useCallback(() => {
    dispatch(
      setMemoTagInfoBoxDisplay({
        isMemoTagBoxVisible: false,
        forceAutoFocusOnMemoField: false,
      }),
    );
    dispatch(closeModal("MODAL_SEND"));
    onClose?.();
  }, [dispatch, onClose]);

  useEffect(() => {
    if (!newSendFlow?.enabled || !isOpened) return;

    const sendData = modalData || {};
    const amount = sendData.amount ? sendData.amount.toString() : undefined;

    dispatch(
      openSendFlowDialog({
        params: {
          account: sendData.account ?? undefined,
          parentAccount: sendData.parentAccount ?? undefined,
          recipient: sendData.recipient,
          amount,
          fromMAD: false,
          startWithWarning: sendData.startWithWarning,
        },
        onClose,
      }),
    );
    dispatch(closeModal("MODAL_SEND"));
  }, [dispatch, isOpened, modalData, newSendFlow?.enabled, onClose]);

  if (newSendFlow?.enabled) {
    return null;
  }

  // Old flow: keep Modal wrapper
  return (
    <DomainServiceProvider>
      <Modal
        name="MODAL_SEND"
        centered
        onHide={handleReset}
        onClose={handleModalClose}
        preventBackdropClick={isModalLocked}
        render={({ onClose, data }) => (
          <Body
            stepId={stepId}
            onClose={onClose}
            onChangeStepId={handleStepChange}
            params={data || {}}
          />
        )}
      />
    </DomainServiceProvider>
  );
};
export default SendModal;
