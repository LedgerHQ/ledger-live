import React, { useCallback, useEffect } from "react";
import { BigNumber } from "bignumber.js";
import { Trans, TFunction } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Account, AccountBridge, AccountLike } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";

import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import RequestAmount from "~/renderer/components/RequestAmount";
import Switch from "~/renderer/components/Switch";
import Text from "~/renderer/components/Text";

type Props = {
  parentAccount?: Account;
  account: AccountLike;
  transaction: Transaction;
  onChangeTransaction: (_: AccountBridge<any>) => void;
  status: TransactionStatus;
  bridgePending: boolean;
  t: TFunction;
  initValue?: BigNumber;
  walletConnectProxy?: boolean;
  resetInitValue?: () => void;
};

const AmountField = ({
  account,
  parentAccount,
  transaction,
  onChangeTransaction,
  status,
  bridgePending,
  t,
  initValue,
  resetInitValue,
  walletConnectProxy,
}: Props) => {
  const bridge = getAccountBridge(account, parentAccount);

  useEffect(() => {
    if (initValue && !initValue.eq(transaction.amount || new BigNumber(0))) {
      onChangeTransaction(bridge.updateTransaction(transaction, { amount: initValue }));
      resetInitValue && resetInitValue();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = useCallback(
    (amount: BigNumber) => {
      onChangeTransaction(bridge.updateTransaction(transaction, { amount }));
    },
    [bridge, transaction, onChangeTransaction],
  );

  const onChangeSendMax = useCallback(
    (useAllAmount: boolean) => {
      onChangeTransaction(
        bridge.updateTransaction(transaction, { useAllAmount, amount: new BigNumber(0) }),
      );
    },
    [bridge, transaction, onChangeTransaction],
  );

  if (!status) return null;

  const { useAllAmount } = transaction;
  const { amount, errors, warnings } = status;
  const { amount: amountError, dustLimit: messageDust, gasPrice: messageGas } = errors;
  const { amount: amountWarning } = warnings;

  let amountErrMessage: Error | undefined = amountError;
  let amountWarnMessage: Error | undefined = amountWarning;

  // we ignore zero case for displaying field error because field is empty.
  if (amount.eq(0) && (bridgePending || !useAllAmount)) {
    amountErrMessage = undefined;
    amountWarnMessage = undefined;
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
                if (!walletConnectProxy) {
                  onChangeSendMax(!useAllAmount);
                }
              }}
            >
              <Trans i18nKey="send.steps.details.useMax" />
            </Text>
            <Switch
              small
              isChecked={useAllAmount}
              onChange={onChangeSendMax}
              disabled={walletConnectProxy}
            />
          </Box>
        ) : null}
      </Box>
      <RequestAmount
        disabled={!!useAllAmount || walletConnectProxy}
        account={account}
        validTransactionError={amountErrMessage || messageGas || messageDust}
        validTransactionWarning={amountWarnMessage}
        onChange={onChange}
        value={walletConnectProxy ? transaction.amount : amount}
        autoFocus={!initValue}
      />
    </Box>
  );
};

export default AmountField;
