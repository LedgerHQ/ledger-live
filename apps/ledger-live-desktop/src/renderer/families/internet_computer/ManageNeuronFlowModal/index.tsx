import React, { useState, useCallback } from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";
import {
  ICPAccount,
  ICPTransactionType,
} from "@ledgerhq/live-common/families/internet_computer/types";

const MODAL_NAME = "MODAL_ICP_LIST_NEURONS";

export type Props = {
  account: ICPAccount;
  refresh?: boolean;
  neuronIndex?: number;
  lastManageAction?: ICPTransactionType;
  stepId?: StepId;
};

export default function ListNeuronsModal({
  refresh = false,
  lastManageAction: initLastManageAction,
  neuronIndex = 0,
  stepId: initStepId = "listNeuron",
}: Props) {
  const [stepId, setStepId] = useState<StepId>(refresh ? "device" : initStepId);
  const [lastManageAction, setLastManageAction] = useState<ICPTransactionType | undefined>(
    initLastManageAction,
  );

  const onHide = useCallback(() => {
    setStepId("device");
  }, []);
  const onChange = useCallback((id: StepId) => {
    setStepId(id);
  }, []);
  const isModalLocked = ["device", "confirmation"].includes(stepId);
  let width: number | undefined;
  if (stepId === "manage") {
    width = 800;
  } else if (stepId === "listNeuron") {
    width = 650;
  }

  return (
    <Modal
      name={MODAL_NAME}
      centered
      onHide={onHide}
      preventBackdropClick={isModalLocked}
      width={width}
      render={({ onClose, data }) => (
        <Body
          account={data.account}
          refresh={refresh}
          stepId={stepId}
          onClose={onClose}
          onChangeStepId={onChange}
          neuronIndex={neuronIndex}
          lastManageAction={lastManageAction}
          setLastManageAction={setLastManageAction}
        />
      )}
    />
  );
}
