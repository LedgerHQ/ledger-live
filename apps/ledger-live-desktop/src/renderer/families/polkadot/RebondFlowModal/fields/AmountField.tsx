import invariant from "invariant";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { TFunction } from "i18next";
import styled from "styled-components";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import {
  PolkadotAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/polkadot/types";
import SpendableAmount from "~/renderer/components/SpendableAmount";
import Label from "~/renderer/components/Label";
import Box from "~/renderer/components/Box";
import InputCurrency from "~/renderer/components/InputCurrency";
import Switch from "~/renderer/components/Switch";
import Text from "~/renderer/components/Text";

const InputRight = styled(Box).attrs(() => ({
  ff: "Inter|Medium",
  color: "palette.text.shade60",
  fontSize: 4,
  justifyContent: "center",
}))`
  padding-right: 10px;
`;
const TextSeparator = styled.span`
  height: 1em;
  margin: 0 4px;
  border: 1px solid;
  border-color: ${p => p.theme.colors.palette.text.shade20};
`;
type Props = {
  t: TFunction;
  account: PolkadotAccount;
  transaction: Transaction;
  status: TransactionStatus;
  onChangeTransaction: (a: Transaction) => void;
  bridgePending: boolean;
};
const AmountField = ({ account, onChangeTransaction, transaction, status }: Props) => {
  invariant(account && transaction && account.spendableBalance, "account and transaction required");
  const bridge = getAccountBridge(account);
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
          <Trans i18nKey="polkadot.rebond.steps.amount.amountLabel" />
        </Label>
        {typeof useAllAmount === "boolean" ? (
          <Box horizontal alignItems="center">
            <Text color="palette.text.shade40" ff="Inter|Medium" fontSize={13}>
              <Trans i18nKey="polkadot.rebond.steps.amount.availableLabel" />
              {": "}
            </Text>
            <Text color="palette.text.shade40" ff="Inter|Medium" fontSize={13}>
              <SpendableAmount account={account} transaction={transaction} disableRounding />
            </Text>
            <TextSeparator />
            <Text
              color="palette.text.shade40"
              ff="Inter|Medium"
              fontSize={13}
              style={{
                paddingRight: 5,
              }}
              onClick={() => onChangeUseMax(!useAllAmount)}
            >
              <Trans i18nKey="polkadot.rebond.steps.amount.maxLabel" />
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
        containerProps={{
          grow: true,
        }}
        defaultUnit={defaultUnit}
        value={amount}
        onChange={onChange}
        renderRight={<InputRight>{defaultUnit.code}</InputRight>}
      />
    </Box>
  );
};
export default AmountField;
