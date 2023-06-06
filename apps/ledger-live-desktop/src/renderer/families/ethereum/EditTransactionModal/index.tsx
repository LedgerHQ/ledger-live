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
  isNftOperation: boolean;
};

const EditTransactionModal = ({
  account,
  parentAccount,
  transactionRaw,
  transactionHash,
  isNftOperation,
}: Props) => {
  const [stepId, setStepId] = useState<StepId>("method");
  const [isNftSend, setIsNFTSend] = useState(false);
  const handleReset = useCallback(() => setStepId("method"), []);
  const handleStepChange = useCallback(stepId => setStepId(stepId), []);
  const handleSetIsNFTSend = useCallback(isNftSend => setIsNFTSend(isNftSend), []);
  return (
    <DomainServiceProvider>
      <Modal
        name="MODAL_EDIT_TRANSACTION"
        centered
        preventBackdropClick={true}
        onHide={handleReset}
        render={({ onClose }) => (
          <Body
            stepId={stepId}
            setIsNFTSend={handleSetIsNFTSend}
            isNftSend={isNftSend}
            onChangeStepId={handleStepChange}
            onClose={onClose}
            params={{
              account: account,
              parentAccount: parentAccount,
              transactionRaw: transactionRaw as EthereumTransactionRaw,
              transactionHash: transactionHash,
              isNftOperation: isNftOperation,
            }}
          />
        )}
      />
    </DomainServiceProvider>
  );
};

export default memo<Props>(EditTransactionModal);
