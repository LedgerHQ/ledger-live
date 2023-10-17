import { TransactionRaw } from "@ledgerhq/coin-evm/types/index";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import { Account, AccountLike, TransactionCommonRaw } from "@ledgerhq/types-live";
import React, { memo, useCallback, useState } from "react";
import Modal from "~/renderer/components/Modal";
import Body, { Props as BodyProps } from "./Body";
import { StepId } from "./types";

export type EditTransactionModalProps = {
  account: AccountLike | undefined | null;
  parentAccount: Account | undefined | null;
  transactionRaw: TransactionCommonRaw;
  transactionHash: string;
};

const EditTransactionModalComponent = ({
  account,
  parentAccount,
  transactionRaw,
  transactionHash,
}: EditTransactionModalProps) => {
  const [stepId, setStepId] = useState<StepId>("method");
  const handleReset = useCallback(() => setStepId("method"), []);
  const handleStepChange: BodyProps["onChangeStepId"] = useCallback(
    stepId => setStepId(stepId),
    [],
  );

  return (
    <DomainServiceProvider>
      <Modal
        name="MODAL_EVM_EDIT_TRANSACTION"
        centered
        preventBackdropClick={true}
        onHide={handleReset}
        render={({ onClose }) => (
          <Body
            stepId={stepId}
            onChangeStepId={handleStepChange}
            onClose={onClose}
            params={{
              account: account,
              parentAccount: parentAccount,
              transactionRaw: transactionRaw as TransactionRaw,
              transactionHash: transactionHash,
            }}
          />
        )}
      />
    </DomainServiceProvider>
  );
};

export const EditTransactionModal = memo<EditTransactionModalProps>(EditTransactionModalComponent);
