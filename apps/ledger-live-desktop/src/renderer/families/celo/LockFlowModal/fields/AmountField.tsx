import invariant from "invariant";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { TFunction } from "i18next";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  CeloAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/celo/types";
import SpendableAmount from "~/renderer/components/SpendableAmount";
import Label from "~/renderer/components/Label";
import Box from "~/renderer/components/Box";
import InputCurrency from "~/renderer/components/InputCurrency";
import Switch from "~/renderer/components/Switch";
import Text from "~/renderer/components/Text";
import * as S from "./AmountField.styles";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
type Props = {
  t: TFunction;
  account: CeloAccount | undefined | null;
  parentAccount: CeloAccount | undefined | null;
  transaction: Transaction | undefined | null;
  status: TransactionStatus;
  onChangeTransaction: (a: Transaction) => void;
  bridgePending: boolean;
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
  const defaultUnit = useAccountUnit(account);
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
        bridge.updateTransaction(transaction, {
          useAllAmount,
          amount: BigNumber(0),
        }),
      );
    },
    [bridge, transaction, onChangeTransaction],
  );
  if (!status) return null;
  const { useAllAmount } = transaction;
  const { amount, errors, warnings } = status;
  let amountError: Error | null = errors.amount;

  // we ignore zero case for displaying field error because field is empty.
  if (amount.eq(0)) {
    amountError = null;
  }
  return (
    <Box flow={1}>
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
              style={{
                paddingRight: 5,
              }}
              onClick={() => onChangeUseMax(!useAllAmount)}
            >
              <Trans i18nKey="celo.lock.steps.amount.maxLabel" />
            </Text>
            <Switch small isChecked={useAllAmount} onChange={onChangeUseMax} />
          </Box>
        ) : null}
      </Box>
      <InputCurrency
        data-testid="modal-amount-field"
        disabled={!!useAllAmount}
        autoFocus={true}
        error={amountError}
        warning={warnings.amount}
        containerProps={{
          grow: true,
        }}
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
