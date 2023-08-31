import React, { PureComponent, memo, useCallback } from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import styled from "styled-components";
import CheckBox from "~/renderer/components/CheckBox";
import Text from "~/renderer/components/Text";
import { StepProps } from "../types";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Flex } from "@ledgerhq/react-ui";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import { getEnv } from "@ledgerhq/live-env";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import { TransactionHasBeenValidatedError } from "@ledgerhq/errors";
import { apiForCurrency } from "@ledgerhq/live-common/families/ethereum/api/index";
import invariant from "invariant";

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
  setEditType,
  t,
  haveFundToSpeedup,
  haveFundToCancel,
  isOldestEditableOperation,
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

export class StepMethodFooter extends PureComponent<StepProps> {
  state = {
    transactionHasBeenValidated: false,
  };

  handleContinueClick = () => {
    const { transitionTo, editType, updateTransaction, account, parentAccount, transactionRaw } =
      this.props;
    invariant(account && transactionRaw, "account and transactionRaw required");
    const bridge = getAccountBridge(account, parentAccount);
    if (editType === "speedup") {
      updateTransaction(tx =>
        bridge.updateTransaction(tx, {
          amount: new BigNumber(transactionRaw.amount),
          data: transactionRaw.data ? Buffer.from(transactionRaw.data, "hex") : undefined,
          nonce: transactionRaw.nonce,
          recipient: transactionRaw.recipient,
          mode: transactionRaw.mode,
          networkInfo: null, // force to update network fee
          feesStrategy: "fast", // set "fast" as default option for speedup flow
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          gasPrice: null,
          useAllAmount: false,
        }),
      );
    } else {
      const mainAccount = getMainAccount(account, parentAccount);
      updateTransaction(tx =>
        bridge.updateTransaction(tx, {
          amount: new BigNumber(0),
          allowZeroAmount: true,
          data: undefined,
          nonce: transactionRaw.nonce,
          mode: "send",
          recipient: mainAccount.freshAddress,
          // increase gas fees in case of cancel flow as we don't have the fees input screen for cancel flow
          maxFeePerGas: transactionRaw.maxFeePerGas
            ? new BigNumber(transactionRaw.maxFeePerGas)
                .times(1 + getEnv("EDIT_TX_EIP1559_MAXFEE_GAP_CANCEL_FACTOR"))
                .integerValue()
            : null,
          maxPriorityFeePerGas: transactionRaw.maxPriorityFeePerGas
            ? new BigNumber(transactionRaw.maxPriorityFeePerGas)
                .times(1 + getEnv("EDIT_TX_EIP1559_FEE_GAP_SPEEDUP_FACTOR"))
                .integerValue()
            : null,
          gasPrice: transactionRaw.gasPrice
            ? new BigNumber(transactionRaw.gasPrice)
                .times(1 + getEnv("EDIT_TX_LEGACY_GASPRICE_GAP_CANCEL_FACTOR"))
                .integerValue()
            : null,
          feesStrategy: "custom",
          useAllAmount: false,
        }),
      );
    }
    // skip fees input screen for cancel flow
    transitionTo(editType === "speedup" ? "fees" : "summary");
  };

  componentDidMount() {
    const { account, parentAccount, transaction, transactionHash } = this.props;
    if (!account || !transaction || !transactionHash) return;
    const mainAccount = getMainAccount(account, parentAccount);
    if (mainAccount.currency.family !== "ethereum") return;
    apiForCurrency(mainAccount.currency)
      .getTransactionByHash(transactionHash)
      .then(tx => {
        if (tx?.confirmations) {
          this.setState({ transactionHasBeenValidated: true });
        }
      });
  }

  render() {
    const { t, haveFundToSpeedup, haveFundToCancel, isOldestEditableOperation } = this.props;

    return (
      <>
        {this.state.transactionHasBeenValidated ? (
          <ErrorBanner error={new TransactionHasBeenValidatedError()} />
        ) : null}
        <Button
          id={"send-recipient-continue-button"}
          primary
          disabled={
            this.state.transactionHasBeenValidated ||
            ((!haveFundToSpeedup || !isOldestEditableOperation) && !haveFundToCancel)
          } // continue button is disable if both "speedup" and "cancel" are not possible
          onClick={this.handleContinueClick}
        >
          {t("common.continue")}
        </Button>
      </>
    );
  }
}

export default memo<StepProps>(StepMethod);
