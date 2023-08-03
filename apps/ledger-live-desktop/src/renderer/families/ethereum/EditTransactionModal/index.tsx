import React, { useCallback, useState, memo } from "react";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { Account, AccountLike, TransactionCommonRaw } from "@ledgerhq/types-live";
import { TransactionRaw as EthereumTransactionRaw } from "@ledgerhq/live-common/families/ethereum/types";
import { StepId } from "./types";

export type Props = {
  account: AccountLike | undefined | null;
  parentAccount: Account | undefined | null;
  transactionRaw: TransactionCommonRaw;
  transactionHash: string;
};

const EditTransactionModal = ({
  account,
  parentAccount,
  transactionRaw,
  transactionHash,
}: Props) => {
  const [stepId, setStepId] = useState<StepId>("method");
  const handleReset = useCallback(() => setStepId("method"), []);
  const handleStepChange = useCallback(stepId => setStepId(stepId), []);
  return (
    <DomainServiceProvider>
      <Modal
        name="MODAL_ETH_EDIT_TRANSACTION"
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
              transactionRaw: transactionRaw as EthereumTransactionRaw,
              transactionHash: transactionHash,
            }}
          />
        )}
      />
    </DomainServiceProvider>
  );
};

export default memo<Props>(EditTransactionModal);
