import { getTransactionByHash } from "@ledgerhq/coin-evm/api/transaction/index";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import { TransactionHasBeenValidatedError } from "@ledgerhq/errors";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getUpdateTransactionPatch } from "@ledgerhq/live-common/families/evm/getUpdateTransactionPatch";
import { Flex } from "@ledgerhq/react-ui";
import { AccountBridge } from "@ledgerhq/types-live";
import invariant from "invariant";
import React, { memo, useCallback, useState } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { urls } from "~/config/urls";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CheckBox from "~/renderer/components/CheckBox";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Text from "~/renderer/components/Text";
import { openURL } from "~/renderer/linking";
import { StepProps } from "../types";

const EditTypeWrapper = styled(Box)<{ selected: boolean }>`
  border: ${p =>
    `1px solid ${
      p.selected ? p.theme.colors.palette.primary.main : p.theme.colors.palette.divider
    }`};
  padding: 20px 16px;
  border-radius: 4px;
  &:hover {
    cursor: "pointer";
  }
`;

const EditTypeHeader = styled(Box)<{ selected: boolean }>`
  color: ${p =>
    p.selected ? p.theme.colors.palette.primary.main : p.theme.colors.palette.text.shade50};
  margin-left: 10px;
`;

const Description = styled(Box)<{ selected: boolean }>`
  color: ${p => (p.selected ? "white" : "gray")};
  margin-top: 5px;
  margin-left: 15px;
  width: 400px;
`;

const StepMethod = ({
  account,
  editType,
  haveFundToSpeedup,
  haveFundToCancel,
  isOldestEditableOperation,
  setEditType,
  t,
}: StepProps) => {
  invariant(account, "account required");
  const isCancel = editType === "cancel";
  const isSpeedup = editType === "speedup";
  const disableSpeedup = !haveFundToSpeedup || !isOldestEditableOperation;
  const disableCancel = !haveFundToCancel;

  const handleSpeedupClick = useCallback(() => {
    if (!disableSpeedup) {
      setEditType("speedup");
    }
  }, [disableSpeedup, setEditType]);

  const handleCancelClick = useCallback(() => {
    if (!disableCancel) {
      setEditType("cancel");
    }
  }, [disableCancel, setEditType]);

  const handleLearnMoreClick = useCallback(() => {
    openURL(urls.editEthTx.learnMore);
  }, []);

  return (
    <Box flow={4}>
      <EditTypeWrapper key={0} selected={isSpeedup} onClick={handleSpeedupClick}>
        <Flex flexDirection="row" justifyContent="left" alignItems="center">
          <CheckBox isChecked={isSpeedup} disabled={disableSpeedup} />
          <Box>
            <EditTypeHeader horizontal alignItems="center" selected={isSpeedup}>
              <Text fontSize={14} ff="Inter|SemiBold" uppercase ml={1}>
                <Trans i18nKey={"operation.edit.speedUp.title"} />
              </Text>
            </EditTypeHeader>
            <Description selected={editType === "speedup"}>
              <Text ff="Inter|Medium" fontSize={12}>
                {haveFundToSpeedup && isOldestEditableOperation ? (
                  <Trans i18nKey={"operation.edit.speedUp.description"} />
                ) : isOldestEditableOperation ? (
                  <Trans i18nKey={"operation.edit.error.notEnoughFundsToSpeedup"} />
                ) : (
                  <Trans i18nKey={"operation.edit.error.notlowestNonceToSpeedup"} />
                )}
              </Text>
            </Description>
          </Box>
        </Flex>
      </EditTypeWrapper>
      <EditTypeWrapper key={1} selected={isCancel} onClick={handleCancelClick}>
        <Flex flexDirection="row" justifyContent="left" alignItems="center">
          <CheckBox isChecked={editType === "cancel"} disabled={disableCancel} />
          <Box>
            <EditTypeHeader horizontal alignItems="center" selected={isCancel}>
              <Text fontSize={14} ff="Inter|SemiBold" uppercase ml={1}>
                <Trans i18nKey={"operation.edit.cancel.title"} />
              </Text>
            </EditTypeHeader>
            <Description selected={isCancel}>
              <Text ff="Inter|Medium" fontSize={12}>
                {haveFundToCancel ? (
                  <Trans
                    i18nKey={"operation.edit.cancel.description"}
                    values={{
                      ticker:
                        account.type === "TokenAccount"
                          ? account.token.ticker
                          : account.currency.ticker,
                    }}
                  />
                ) : (
                  <Trans i18nKey={"operation.edit.error.notEnoughFundsToCancel"} />
                )}
              </Text>
            </Description>
          </Box>
        </Flex>
      </EditTypeWrapper>
      <Text
        ff="Inter|Medium"
        fontSize={12}
        style={{ textDecoration: "underline", textAlign: "center", cursor: "pointer" }}
        onClick={handleLearnMoreClick}
      >
        {t("operation.edit.learnMore")}
      </Text>
    </Box>
  );
};

export const StepMethodFooter: React.FC<StepProps> = (props: StepProps) => {
  const [transactionHasBeenValidated, setTransactionHasBeenValidated] = useState(false);
  const {
    editType,
    account,
    parentAccount,
    transaction,
    transactionToUpdate,
    transactionHash,
    haveFundToSpeedup,
    haveFundToCancel,
    isOldestEditableOperation,
    t,
    updateTransaction,
    transitionTo,
  } = props;

  const handleContinueClick = async () => {
    invariant(account, "account required");
    invariant(transaction, "transaction required");
    invariant(transactionToUpdate, "transactionToUpdate required");
    invariant(editType, "editType required");

    const bridge: AccountBridge<EvmTransaction> = getAccountBridge(account, parentAccount);
    const mainAccount = getMainAccount(account, parentAccount);

    const patch = await getUpdateTransactionPatch({
      account: mainAccount,
      transaction: transactionToUpdate,
      editType,
    });

    updateTransaction(tx => bridge.updateTransaction(tx, patch));

    transitionTo("summary");
  };

  if (!account || !transaction || !transactionHash) {
    return null;
  }

  const mainAccount = getMainAccount(account, parentAccount);

  getTransactionByHash(mainAccount.currency, transactionHash).then(tx => {
    if (tx?.confirmations) {
      setTransactionHasBeenValidated(true);
    }
  });

  return (
    <>
      {transactionHasBeenValidated ? (
        <ErrorBanner error={new TransactionHasBeenValidatedError()} />
      ) : null}
      <Button
        id={"send-recipient-continue-button"}
        primary
        disabled={
          transactionHasBeenValidated ||
          ((!haveFundToSpeedup || !isOldestEditableOperation) && !haveFundToCancel)
        } // continue button is disable if both "speedup" and "cancel" are not possible
        onClick={handleContinueClick}
      >
        {t("common.continue")}
      </Button>
    </>
  );
};

export default memo<StepProps>(StepMethod);
