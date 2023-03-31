// @flow

import React, { PureComponent, memo } from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import styled from "styled-components";
import CheckBox from "~/renderer/components/CheckBox";
import Text from "~/renderer/components/Text";
import type { StepProps } from "../types";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Flex } from "@ledgerhq/react-ui";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";

const EditTypeWrapper = styled(Box)`
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
const EditTypeHeader = styled(Box)`
  color: ${p =>
    p.selected ? p.theme.colors.palette.primary.main : p.theme.colors.palette.text.shade50};
  margin-left: 10px;
`;

const Description = styled(Box)`
  color: ${p => (p.selected ? "white" : "gray")};
  margin-top: 5px;
  margin-left: 15px;
  width: 400px;
`;

const StepMethod = ({
  account,
  editType,
  setEditType,
  t,
  haveFundToSpeedup,
  haveFundToCancel,
  isOldestEditableOperation,
}: StepProps) => {
  const isCancel = editType === "cancel";
  const isSpeedup = editType === "speedup";
  const disableSpeedup = !haveFundToSpeedup || !isOldestEditableOperation;
  const disableCancel = !haveFundToCancel;
  return (
    <Box flow={4}>
      <EditTypeWrapper
        key={0}
        selected={isSpeedup}
        onClick={() => {
          if (!disableSpeedup) {
            setEditType("speedup");
          }
        }}
      >
        <Flex flexDirection="row" justifyContent="left" alignItems="center">
          <CheckBox style={{ marginLeft: "0px" }} isChecked={isSpeedup} disabled={disableSpeedup} />
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
      <EditTypeWrapper
        key={1}
        selected={isCancel}
        onClick={() => {
          if (!disableCancel) {
            setEditType("cancel");
          }
        }}
      >
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
        onClick={() => openURL(urls.editEthTx.learnMore)}
      >
        {t("operation.edit.learnMore")}
      </Text>
    </Box>
  );
};

export class StepMethodFooter extends PureComponent<StepProps> {
  render() {
    const {
      t,
      transitionTo,
      editType,
      updateTransaction,
      account,
      parentAccount,
      transactionRaw,
      transactionSequenceNumber,
      isNftOperation,
      setIsNFTSend,
      haveFundToSpeedup,
      haveFundToCancel,
      isOldestEditableOperation,
    } = this.props;
    const bridge = getAccountBridge(account, parentAccount);
    return (
      <>
        <Button
          id={"send-recipient-continue-button"}
          primary
          disabled={(!haveFundToSpeedup || !isOldestEditableOperation) && !haveFundToCancel} // continue button is disable if both "speedup" and "cancel" are not possible
          onClick={() => {
            if (isNftOperation) {
              setIsNFTSend(editType === "speedup");
            }
            if (editType === "speedup") {
              updateTransaction(tx =>
                bridge.updateTransaction(tx, {
                  amount: new BigNumber(transactionRaw.amount),
                  data: transactionRaw.data,
                  nonce: transactionSequenceNumber,
                  recipient: transactionRaw.recipient,
                  mode: transactionRaw.mode,
                  networkInfo: null, // force to update network fee
                  feesStrategy: "fast", // set "fast" as default option for speedup flow
                  maxFeePerGas: null,
                  maxPriorityFeePerGas: null,
                  gasPrice: null,
                }),
              );
            } else {
              updateTransaction(tx =>
                bridge.updateTransaction(tx, {
                  amount: new BigNumber(0),
                  allowZeroAmount: true,
                  data: undefined,
                  nonce: transactionSequenceNumber,
                  mode: "send",
                  recipient: account.freshAddress ?? parentAccount.freshAddress,
                  // increase gas fees in case of cancel flow as we don't have the fees input screen for cancel flow
                  maxFeePerGas: transactionRaw.maxFeePerGas
                    ? new BigNumber(Math.round(transactionRaw.maxFeePerGas * 1.3))
                    : null,
                  maxPriorityFeePerGas: transactionRaw.maxPriorityFeePerGas
                    ? new BigNumber(Math.round(transactionRaw.maxPriorityFeePerGas * 1.1))
                    : null,
                  gasPrice: transactionRaw.gasPrice
                    ? new BigNumber(Math.round(transactionRaw.gasPrice * 1.3))
                    : null,
                  feesStrategy: "custom",
                }),
              );
            }
            // skip fees input screen for cancel flow
            transitionTo(editType === "speedup" ? "fees" : "summary");
          }}
        >
          {t("common.continue")}
        </Button>
      </>
    );
  }
}

export default memo<StepProps>(StepMethod);
