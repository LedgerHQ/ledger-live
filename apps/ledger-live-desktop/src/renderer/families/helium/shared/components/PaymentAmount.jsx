// @flow
import React, { useCallback, useEffect } from "react";
import { BigNumber } from "bignumber.js";
import { Trans } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type {
  Account,
  AccountLike,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/types/index";
import type { TFunction } from "react-i18next";

import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import RequestAmount from "~/renderer/components/RequestAmount";
import Text from "~/renderer/components/Text";
import Switch from "~/renderer/components/Switch";

type Props = {
  parentAccount: ?Account,
  account: AccountLike,
  transaction: Transaction,
  onChangeTransaction: (*) => void,
  status: TransactionStatus,
  bridgePending: boolean,
  t: TFunction,
  initValue?: BigNumber,
  resetInitValue?: () => void,
  readOnly?: boolean,
  disableSendMax?: boolean,
};

const PaymentAmount = ({
  account,
  parentAccount,
  transaction,
  onChangeTransaction,
  status,
  bridgePending,
  t,
  initValue,
  resetInitValue,
}: Props) => {
  const bridge = getAccountBridge(account, parentAccount);

  useEffect(() => {
    if (initValue && !initValue.eq(transaction.model.paymentAmount || BigNumber(0))) {
      onChangeTransaction(
        bridge.updateTransaction(transaction, {
          model: { ...transaction.model, paymentAmount: initValue },
        }),
      );
      resetInitValue && resetInitValue();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = useCallback(
    (paymentAmount: BigNumber) => {
      onChangeTransaction(
        bridge.updateTransaction(transaction, {
          model: {
            ...transaction.model,
            paymentAmount: new BigNumber(paymentAmount),
          },
        }),
      );
    },
    [bridge, transaction, onChangeTransaction],
  );

  const onChangeSendMax = useCallback(
    (useAllAmount: boolean) => {
      onChangeTransaction(
        bridge.updateTransaction(transaction, {
          useAllAmount,
          model: {
            ...transaction.model,
            paymentAmount: useAllAmount
              ? BigNumber(account.balance - transaction.fees).decimalPlaces(2)
              : BigNumber(0),
          },
        }),
      );
    },
    [bridge, transaction, onChangeTransaction, account],
  );

  if (!status) return null;
  const { useAllAmount } = transaction;
  const { amount, errors, warnings } = status;
  let { amount: amountError, gasPrice: messageGas } = errors;
  let { amount: amountWarning } = warnings;

  // we ignore zero case for displaying field error because field is empty.

  if (amount.eq(0) && (bridgePending || !useAllAmount)) {
    amountError = null;
    amountWarning = null;
  }

  return (
    <Box flow={1}>
      <Box
        horizontal
        alignItems="center"
        justifyContent="space-between"
        style={{ width: "50%", paddingRight: 28 }}
      >
        <Label>{t("send.steps.details.amount")}</Label>
        {typeof useAllAmount === "boolean" ? (
          <Box horizontal alignItems="center">
            <Text
              color="palette.text.shade40"
              ff="Inter|Medium"
              fontSize={10}
              style={{ paddingRight: 5 }}
              onClick={() => {
                onChangeSendMax(!useAllAmount);
              }}
            >
              <Trans i18nKey="send.steps.details.useMax" />
            </Text>
            <Switch small isChecked={useAllAmount} onChange={onChangeSendMax} />
          </Box>
        ) : null}
      </Box>
      <RequestAmount
        account={account}
        validTransactionError={amountError || messageGas}
        validTransactionWarning={amountWarning}
        onChange={onChange}
        value={BigNumber(transaction.model.paymentAmount)}
        showCountervalue={false}
        autoFocus
      />
    </Box>
  );
};

export default PaymentAmount;
