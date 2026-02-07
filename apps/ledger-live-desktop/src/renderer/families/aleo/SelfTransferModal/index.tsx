import BigNumber from "bignumber.js";
import React, { useCallback, useMemo, useState } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import Modal from "~/renderer/components/Modal";
import Body from "~/renderer/modals/Send/Body";
import { StepId } from "~/renderer/modals/Send/types";
import { setMemoTagInfoBoxDisplay } from "~/renderer/actions/UI";
import { closeModal } from "~/renderer/actions/modals";
import { isModalOpened, getModalData } from "~/renderer/reducers/modals";
import { openSendFlowDialog } from "~/renderer/reducers/sendFlow";
import type { State } from "~/renderer/reducers";
import { useNewSendFlowFeature } from "LLD/features/Send/hooks/useNewSendFlowFeature";
import { AleoCustomModal } from "../modals";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";

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

const SelfTransferModal = ({ stepId: initialStepId, onClose }: Props) => {
  const [stepId, setStepId] = useState<StepId>(() => initialStepId || "recipient");
  const handleReset = useCallback(() => setStepId("recipient"), []);
  const handleStepChange = useCallback((stepId: StepId) => setStepId(stepId), []);
  const isModalLocked = MODAL_LOCKED[stepId];
  const dispatch = useDispatch();

  const { isEnabledForFamily, getFamilyFromAccount } = useNewSendFlowFeature();
  const isOpened = useSelector((state: State) =>
    isModalOpened(state, AleoCustomModal.SELF_TRANSFER),
  );
  const modalData = useSelector((state: State) =>
    getModalData(state, AleoCustomModal.SELF_TRANSFER),
  );

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
    dispatch(closeModal(AleoCustomModal.SELF_TRANSFER));
    onClose?.();
  }, [dispatch, onClose]);

  useMemo(() => {
    if (!shouldRedirectToNewFlow || !isOpened) return;

    const sendData = modalData || {};
    const amount = sendData.amount ? sendData.amount.toString() : undefined;

    console.log("*** self transfer opening", {
      account: sendData.account ?? undefined,
      parentAccount: sendData.parentAccount ?? undefined,
      recipient: sendData.recipient,
      amount,
      fromMAD: false,
      startWithWarning: sendData.startWithWarning,
    });

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
    dispatch(closeModal(AleoCustomModal.SELF_TRANSFER));
  }, [dispatch, isOpened, modalData, shouldRedirectToNewFlow, onClose]);

  console.log("*** self transfer modal", { modalData });

  if (shouldRedirectToNewFlow) {
    return null;
  }

  // Old flow: keep Modal wrapper
  return (
    <DomainServiceProvider>
      <Modal
        name={AleoCustomModal.SELF_TRANSFER}
        centered
        onHide={handleReset}
        onClose={handleModalClose}
        preventBackdropClick={isModalLocked}
        render={({ onClose, data }) => {
          return (
            <Body
              stepId={stepId}
              onClose={onClose}
              onChangeStepId={handleStepChange}
              params={{
                account: data.account,
                transaction: {
                  family: "aleo",
                  amount: new BigNumber(0),
                  useAllAmount: false,
                  recipient: data.account.freshAddress,
                  fees: new BigNumber(0),
                  type: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE,
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
