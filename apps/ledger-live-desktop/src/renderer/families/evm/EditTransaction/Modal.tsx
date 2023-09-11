import React, { useCallback, useState, memo } from "react";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { Account, AccountLike, TransactionCommonRaw } from "@ledgerhq/types-live";
import { StepId } from "./types";
import { TransactionRaw } from "@ledgerhq/coin-evm/types/index";

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
  const handleStepChange = useCallback(stepId => setStepId(stepId), []);

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
