import React, { useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";
import { setMemoTagInfoBoxDisplay } from "~/renderer/actions/UI";
import { closeModal } from "~/renderer/actions/modals";
import { isModalOpened, getModalData } from "~/renderer/reducers/modals";
import { State } from "~/renderer/reducers";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import SendWorkflow from "LLD/features/Send";
import { SendRecipientFlow } from "LLD/features/Send/screens/Recipient/SendRecipientFlow";

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

  const newSendFlow = useFeature("newSendFlow");
  const isOpen = useSelector((state: State) => isModalOpened(state, "MODAL_SEND"));
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

  // New send flow with account selected: render Dialog directly without Modal wrapper
  if (newSendFlow?.enabled && modalData?.account && isOpen) {
    return (
      <DomainServiceProvider>
        <SendRecipientFlow
          account={modalData.account}
          parentAccount={modalData.parentAccount ?? undefined}
          onClose={handleModalClose}
          fromMAD={(modalData as { fromMAD?: boolean })?.fromMAD ?? false}
          onRecipientSelected={(recipient, ensName) => {
            // TODO: Navigate to amount step with recipient
            console.log("Recipient selected:", recipient, ensName);
          }}
        />
      </DomainServiceProvider>
    );
  }

  return (
    <DomainServiceProvider>
      <Modal
        name="MODAL_SEND"
        centered
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

          // No preselected account: start the MAD-based account selection flow.
          return <SendWorkflow onClose={onClose} params={{}} />;
        }}
      />
    </DomainServiceProvider>
  );
};
export default SendModal;
