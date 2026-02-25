import React, { useCallback, useMemo, useState } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";
import { setMemoTagInfoBoxDisplay } from "~/renderer/actions/UI";
import { closeModal } from "~/renderer/actions/modals";
import { isModalOpened, getModalData } from "~/renderer/reducers/modals";
import { openSendFlowDialog } from "~/renderer/reducers/sendFlow";
import type { State } from "~/renderer/reducers";
import { useNewSendFlowFeature } from "LLD/features/Send/hooks/useNewSendFlowFeature";

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
  const [stepId, setStepId] = useState<StepId>(() => initialStepId || "recipient");
  const handleReset = useCallback(() => setStepId("recipient"), []);
  const handleStepChange = useCallback((stepId: StepId) => setStepId(stepId), []);
  const isModalLocked = MODAL_LOCKED[stepId];
  const dispatch = useDispatch();

  const { isEnabledForFamily, getFamilyFromAccount } = useNewSendFlowFeature();
  const isOpened = useSelector((state: State) => isModalOpened(state, "MODAL_SEND"));
  const modalData = useSelector((state: State) => getModalData(state, "MODAL_SEND"));

  const family = getFamilyFromAccount(
    modalData?.account ?? undefined,
    modalData?.parentAccount ?? null,
  );
  const shouldRedirectToNewFlow = isEnabledForFamily(family);

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

  useMemo(() => {
    if (!shouldRedirectToNewFlow || !isOpened) return;

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
  }, [dispatch, isOpened, modalData, shouldRedirectToNewFlow, onClose]);

  if (shouldRedirectToNewFlow) {
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
