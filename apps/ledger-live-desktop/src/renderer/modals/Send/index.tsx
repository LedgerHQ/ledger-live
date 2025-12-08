import React, { useCallback, useState } from "react";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";
import { useDispatch } from "react-redux";
import { setMemoTagInfoBoxDisplay } from "~/renderer/actions/UI";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import SendWorkflow from "LLD/features/Send";

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
  const [stepId, setStep] = useState(() => initialStepId || "recipient");
  const handleReset = useCallback(() => setStep("recipient"), []);
  const handleStepChange = useCallback((stepId: StepId) => setStep(stepId), []);
  const isModalLocked = MODAL_LOCKED[stepId as StepId];
  const dispatch = useDispatch();

  const handleModalClose = useCallback(() => {
    dispatch(
      setMemoTagInfoBoxDisplay({
        isMemoTagBoxVisible: false,
        forceAutoFocusOnMemoField: false,
      }),
    );
    onClose?.();
  }, [dispatch, onClose]);

  const newSendFlow = useFeature("newSendFlow");

  return (
    <DomainServiceProvider>
      <Modal
        name="MODAL_SEND"
        centered
        onHide={handleReset}
        onClose={handleModalClose}
        preventBackdropClick={isModalLocked}
        render={({ onClose, data }) => {
          const sendData = data || {};
          if (!newSendFlow?.enabled) {
            return (
              <Body
                stepId={stepId}
                onClose={onClose}
                onChangeStepId={handleStepChange}
                params={data || {}}
              />
            );
          }

          // New send flow enabled
          if (sendData.account) {
            // Temporary placeholder while the new modal-based steps are being implemented.
            return (
              <div style={{ padding: 24 }}>
                <p>New send flow (work in progress)</p>
                <p>Selected account: {sendData.account?.id}</p>
              </div>
            );
          }

          // No preselected account: start the MAD-based account selection flow.
          return <SendWorkflow onClose={onClose} params={{}} />;
        }}
      />
    </DomainServiceProvider>
  );
};
export default SendModal;
