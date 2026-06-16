import React from "react";
import { TFunction } from "i18next";
import styled from "styled-components";
import { Account, Operation, AccountLike } from "@ledgerhq/types-live";
import { getMainAccount, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getOperationAmountNumber } from "@ledgerhq/live-common/operation";
import { getMarketColor } from "~/renderer/styles/helpers";
import Box from "~/renderer/components/Box";
import ConfirmationCheck from "./ConfirmationCheck";
import { useLLDCoinFamily } from "~/renderer/families";

const Cell = styled(Box).attrs(() => ({
  pl: 4,
  horizontal: true,
  alignItems: "center",
}))``;
type OwnProps = {
  account: AccountLike;
  parentAccount?: Account;
  t: TFunction;
  operation: Operation;
};
type Props = {
  confirmationsNb?: number;
  isConfirmed: boolean;
} & OwnProps;
function ConfirmationCell({ account, parentAccount, isConfirmed, t, operation }: Props) {
  const mainAccount = getMainAccount(account, parentAccount);
  const currency = getAccountCurrency(mainAccount);
  const amount = getOperationAmountNumber(operation);
  const isNegative = amount.isNegative();
  const marketColor = getMarketColor({
    isNegative,
  });

  const cryptoCurrency = "family" in currency && currency.family ? currency : null;
  const specific = useLLDCoinFamily(cryptoCurrency?.family);

  const confirmationCell = specific?.operationDetails?.confirmationCell;
  const SpecificConfirmationCell = confirmationCell ? confirmationCell[operation.type] : null;
  return SpecificConfirmationCell ? (
    <SpecificConfirmationCell
      operation={operation}
      type={operation.type}
      isConfirmed={isConfirmed}
      marketColor={marketColor}
      hasFailed={operation.hasFailed}
      t={t}
    />
  ) : (
    <Cell alignItems="center" justifyContent="flex-start">
      <ConfirmationCheck
        type={operation.type}
        isConfirmed={isConfirmed}
        marketColor={marketColor}
        hasFailed={operation.hasFailed}
        t={t}
      />
    </Cell>
  );
}
export default React.memo(ConfirmationCell);
