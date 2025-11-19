import React, { useCallback, useState } from "react";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import Modal from "~/renderer/components/Modal";
import { Account, AccountLike } from "@ledgerhq/types-live";
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
        {...(newSendFlow?.enabled
          ? {
              width: 460,
              bodyStyle: {
                borderRadius: 16,
                // avoid the modal to scale when the skeleton are displaying
                overflowY: "scroll",
              },
            }
          : {})}
        onHide={handleReset}
        onClose={handleModalClose}
        preventBackdropClick={isModalLocked}
        render={({ onClose, data }) => {
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

          const sendData = (data || {}) as {
            account?: AccountLike | null;
            parentAccount?: Account | null;
          };

          return (
            <SendWorkflow
              onClose={onClose}
              params={{
                account: sendData.account ?? undefined,
                parentAccount: sendData.parentAccount ?? undefined,
              }}
            />
          );
        }}
      />
    </DomainServiceProvider>
  );
};
export default SendModal;
