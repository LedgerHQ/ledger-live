import { getEditTransactionPatch } from "@ledgerhq/coin-evm/editTransaction/index";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Flex } from "@ledgerhq/react-ui";
import { AccountBridge } from "@ledgerhq/types-live";
import invariant from "invariant";
import React, { memo, useCallback } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { urls } from "~/config/urls";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CheckBox from "~/renderer/components/CheckBox";
import Text from "~/renderer/components/Text";
import { openURL } from "~/renderer/linking";
import { TransactionErrorBanner } from "../components/TransactionErrorBanner";
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
  color: ${p =>
    p.selected ? p.theme.colors.palette.primary.main : p.theme.colors.palette.text.shade50};
  margin-top: 5px;
  margin-left: 15px;
  width: 400px;
`;

const getSpeedUpDescriptionKey = (
  haveFundToSpeedup: boolean,
  isOldestEditableOperation: boolean,
):
  | "operation.edit.speedUp.description"
  | "operation.edit.error.notEnoughFundsToSpeedup"
  | "operation.edit.error.notlowestNonceToSpeedup" => {
  if (!haveFundToSpeedup) {
    return "operation.edit.error.notEnoughFundsToSpeedup";
  }

  if (!isOldestEditableOperation) {
    return "operation.edit.error.notlowestNonceToSpeedup";
  }

  return "operation.edit.speedUp.description";
};

const StepMethod = ({
  account,
  parentAccount,
  editType,
  haveFundToSpeedup,
  haveFundToCancel,
  isOldestEditableOperation,
  setEditType,
  t,
}: StepProps) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const isCancel = editType === "cancel";
  const isSpeedup = editType === "speedup";
  const canSpeedup = haveFundToSpeedup && isOldestEditableOperation;
  const canCancel = haveFundToCancel;

  const handleSpeedupClick = useCallback(() => {
    if (canSpeedup) {
      setEditType("speedup");
    }
  }, [canSpeedup, setEditType]);

  const handleCancelClick = useCallback(() => {
    if (canCancel) {
      setEditType("cancel");
    }
  }, [canCancel, setEditType]);

  const handleLearnMoreClick = useCallback(() => {
    openURL(urls.editEvmTx.learnMore);
  }, []);

  return (
    <Box flow={4}>
      <EditTypeWrapper key={0} selected={isSpeedup} onClick={handleSpeedupClick}>
        <Flex flexDirection="row" justifyContent="left" alignItems="center">
          <CheckBox isChecked={isSpeedup} disabled={!canSpeedup} />
          <Box>
            <EditTypeHeader horizontal alignItems="center" selected={isSpeedup}>
              <Text fontSize={14} ff="Inter|SemiBold" uppercase ml={1}>
                <Trans i18nKey={"operation.edit.speedUp.title"} />
              </Text>
            </EditTypeHeader>
            <Description selected={editType === "speedup"}>
              <Text ff="Inter|Medium" fontSize={12}>
                <Trans
                  i18nKey={getSpeedUpDescriptionKey(haveFundToSpeedup, isOldestEditableOperation)}
                />
              </Text>
            </Description>
          </Box>
        </Flex>
      </EditTypeWrapper>
      <EditTypeWrapper key={1} selected={isCancel} onClick={handleCancelClick}>
        <Flex flexDirection="row" justifyContent="left" alignItems="center">
          <CheckBox isChecked={editType === "cancel"} disabled={!canCancel} />
          <Box>
            <EditTypeHeader horizontal alignItems="center" selected={isCancel}>
              <Text fontSize={14} ff="Inter|SemiBold" uppercase ml={1}>
                <Trans i18nKey={"operation.edit.cancel.title"} />
              </Text>
            </EditTypeHeader>
            <Description selected={isCancel}>
              <Text ff="Inter|Medium" fontSize={12}>
                {canCancel ? (
                  <Trans
                    i18nKey={"operation.edit.cancel.description"}
                    values={{
                      // note: ticker is always the main currency ticker
                      ticker: mainAccount.currency.ticker,
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

export const StepMethodFooter: React.FC<StepProps> = ({
  editType,
  account,
  parentAccount,
  transactionToUpdate,
  transactionHasBeenValidated,
  haveFundToSpeedup,
  haveFundToCancel,
  isOldestEditableOperation,
  t,
  updateTransaction,
  transitionTo,
}: StepProps) => {
  const canSpeedup = haveFundToSpeedup && isOldestEditableOperation;
  const canCancel = haveFundToCancel;

  const handleContinueClick = async () => {
    invariant(editType, "editType required");

    const bridge: AccountBridge<EvmTransaction> = getAccountBridge(account, parentAccount);
    const mainAccount = getMainAccount(account, parentAccount);

    const patch = await getEditTransactionPatch({
      account: mainAccount,
      transaction: transactionToUpdate,
      editType,
    });

    updateTransaction(tx => bridge.updateTransaction(tx, patch));

    transitionTo("summary");
  };

  return (
    <>
      <TransactionErrorBanner transactionHasBeenValidated={transactionHasBeenValidated} />
      <Button
        id={"send-recipient-continue-button"}
        primary
        disabled={transactionHasBeenValidated || (!canSpeedup && !canCancel)}
        onClick={handleContinueClick}
      >
        {t("common.continue")}
      </Button>
    </>
  );
};

export default memo<StepProps>(StepMethod);
