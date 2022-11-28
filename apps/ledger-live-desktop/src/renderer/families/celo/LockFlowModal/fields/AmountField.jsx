// @flow

import invariant from "invariant";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import type { TFunction } from "react-i18next";
import type { Account, TransactionStatus } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/families/celo/types";
import SpendableAmount from "~/renderer/components/SpendableAmount";
import Label from "~/renderer/components/Label";
import Box from "~/renderer/components/Box";
import InputCurrency from "~/renderer/components/InputCurrency";
import Switch from "~/renderer/components/Switch";
import Text from "~/renderer/components/Text";
import * as S from "./AmountField.styles";

type Props = {
  t: TFunction,
  account: ?Account,
  parentAccount: ?Account,
  transaction: ?Transaction,
  status: TransactionStatus,
  onChangeTransaction: Transaction => void,
  bridgePending: boolean,
};

const AmountField = ({
  account,
  parentAccount,
  onChangeTransaction,
  transaction,
  status,
}: Props) => {
  invariant(account && transaction && account.spendableBalance, "account and transaction required");

  const bridge = getAccountBridge(account, parentAccount);

  const defaultUnit = getAccountUnit(account);

  const onChange = useCallback(
    (value: BigNumber) => {
      onChangeTransaction(
        bridge.updateTransaction(transaction, {
          amount: value,
        }),
      );
    },
    [bridge, transaction, onChangeTransaction],
  );

  const onChangeUseMax = useCallback(
    (useAllAmount: boolean) => {
      onChangeTransaction(
        bridge.updateTransaction(transaction, { useAllAmount, amount: BigNumber(0) }),
      );
    },
    [bridge, transaction, onChangeTransaction],
  );

  if (!status) return null;
  const { useAllAmount } = transaction;
  const { amount, errors, warnings } = status;
  let { amount: amountError } = errors;

  // we ignore zero case for displaying field error because field is empty.
  if (amount.eq(0)) {
    amountError = null;
  }

  return (
    <Box vertical flow={1}>
      <Box horizontal justifyContent="space-between">
        <Label>
          <Trans i18nKey="celo.lock.steps.amount.amountLabel" />
        </Label>
        {typeof useAllAmount === "boolean" ? (
          <Box horizontal alignItems="center">
            <Text color="palette.text.shade40" ff="Inter|Medium" fontSize={13}>
              <Trans i18nKey="celo.lock.steps.amount.availableLabel" />
              {": "}
            </Text>
            <Text color="palette.text.shade40" ff="Inter|Medium" fontSize={13}>
              <SpendableAmount
                account={account}
                parentAccount={parentAccount}
                transaction={transaction}
                disableRounding
              />
            </Text>
            <S.TextSeparator />
            <Text
              color="palette.text.shade40"
              ff="Inter|Medium"
              fontSize={13}
              style={{ paddingRight: 5 }}
              onClick={() => onChangeUseMax(!useAllAmount)}
            >
              <Trans i18nKey="celo.lock.steps.amount.maxLabel" />
            </Text>
            <Switch small isChecked={useAllAmount} onChange={onChangeUseMax} />
          </Box>
        ) : null}
      </Box>
      <InputCurrency
        disabled={!!useAllAmount}
        autoFocus={true}
        error={amountError}
        warning={warnings.amount}
        containerProps={{ grow: true }}
        defaultUnit={defaultUnit}
        value={amount}
        onChange={onChange}
        renderLeft={false}
        renderRight={<S.InputRight>{defaultUnit.code}</S.InputRight>}
      />
    </Box>
  );
};

export default AmountField;
