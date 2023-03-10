// @flow

import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import styled from "styled-components";
import CheckBox from "~/renderer/components/CheckBox";
import Text from "~/renderer/components/Text";
import type { StepProps } from "../types";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Flex, Link } from "@ledgerhq/react-ui";
import ExternalLink from "~/renderer/icons/ExternalLink";
import { openURL } from "~/renderer/linking";

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

const StepMethod = ({ account, editType, setEditType, t }: StepProps) => {
  const isCancel = editType === "cancel";
  return (
    <Box flow={4}>
      <EditTypeWrapper
        key={0}
        selected={!isCancel}
        onClick={() => {
          setEditType("speedup");
        }}
      >
        <Flex flexDirection="row" justifyContent="left" alignItems="center">
          <CheckBox style={{marginLeft: "0px"}} isChecked={!isCancel} />
          <Box>
          <EditTypeHeader horizontal alignItems="center" selected={!isCancel}>
            <Text fontSize={14} ff="Inter|SemiBold" uppercase ml={1}>
              <Trans i18nKey={"operation.edit.speedUp.title"} />
            </Text>
          </EditTypeHeader>
          <Description selected={editType === "speedup"}>
            <Text ff="Inter|Medium" fontSize={12}>
              <Trans i18nKey={"operation.edit.speedUp.description"} />
            </Text>
          </Description>
          </Box>
        </Flex>
      </EditTypeWrapper>
      <EditTypeWrapper
        key={1}
        selected={isCancel}
        onClick={() => {
          setEditType("cancel");
        }}
      >
        <Flex flexDirection="row" justifyContent="left" alignItems="center">
        <CheckBox isChecked={editType === "cancel"} />
        <Box>
        <EditTypeHeader horizontal alignItems="center" selected={isCancel}>
          <Text fontSize={14} ff="Inter|SemiBold" uppercase ml={1}>
            <Trans i18nKey={"operation.edit.cancel.title"} />
          </Text>
        </EditTypeHeader>
        <Description selected={isCancel}>
        <Text ff="Inter|Medium" fontSize={12}>
          <Trans
            i18nKey={"operation.edit.cancel.description"}
            values={{
              ticker:
                account.type === "TokenAccount" ? account.token.ticker : account.currency.ticker,
            }}
          />
          </Text>
        </Description>
        </Box>
        </Flex>
      </EditTypeWrapper>
        <Text ff="Inter|Medium" fontSize={12} style={{textDecoration: "underline", textAlign: "center", cursor: "pointer"}} onClick={() => openURL("https://support.ledger.com/hc/articles/9756122596765?support=true")}>
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
    } = this.props;
    const bridge = getAccountBridge(account, parentAccount);
    return (
      <>
        <Button
          id={"send-recipient-continue-button"}
          primary
          disabled={false}
          onClick={() => {
            if (isNftOperation) {
              setIsNFTSend(editType === "speedup");
            }
            if (editType === "speedup") {
              updateTransaction(tx =>
                bridge.updateTransaction(tx, {
                  amount: new BigNumber(transactionRaw.amount),
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
                  amount: new BigNumber(1), // send a very little amout of fund to your own account. TODO: Fix Can't set 0 here because of NotEnoughBalance error is thrown from getTransactionStatus
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

export default StepMethod;
