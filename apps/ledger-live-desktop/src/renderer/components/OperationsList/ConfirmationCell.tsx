import React, { PureComponent } from "react";
import { TFunction } from "react-i18next";
import styled from "styled-components";
import { Account, Operation, AccountLike } from "@ledgerhq/types-live";
import { getMainAccount, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getOperationAmountNumber } from "@ledgerhq/live-common/operation";
import { getMarketColor } from "~/renderer/styles/helpers";
import Box from "~/renderer/components/Box";
import ConfirmationCheck from "./ConfirmationCheck";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import perFamilyOperationDetails from "~/renderer/generated/operationDetails";
const Cell: ThemedComponent<{}> = styled(Box).attrs(() => ({
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
  confirmationsNb: number;
  isConfirmed: boolean;
} & OwnProps;
class ConfirmationCell extends PureComponent<Props> {
  render() {
    const { account, parentAccount, isConfirmed, t, operation } = this.props;
    const mainAccount = getMainAccount(account, parentAccount);
    const currency = getAccountCurrency(mainAccount);
    const amount = getOperationAmountNumber(operation);
    const isNegative = amount.isNegative();
    const marketColor = getMarketColor({
      isNegative,
    });

    const specific = currency.family ? perFamilyOperationDetails[currency.family] : null;
    const SpecificConfirmationCell =
      specific && specific.confirmationCell ? specific.confirmationCell[operation.type] : null;
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
}
export default ConfirmationCell;
