import React, { PureComponent } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { rgba } from "~/renderer/styles/helpers";
import Box from "~/renderer/components/Box";
import { createStructuredSelector } from "reselect";
import { TFunction } from "react-i18next";
import { AccountLike, Account, Operation } from "@ledgerhq/types-live";
import {
  getAccountCurrency,
  getAccountName,
  getAccountUnit,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import ConfirmationCell from "./ConfirmationCell";
import DateCell from "./DateCell";
import AccountCell from "./AccountCell";
import AddressCell from "./AddressCell";
import AmountCell from "./AmountCell";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { confirmationsNbForCurrencySelector } from "~/renderer/reducers/settings";
import { isConfirmedOperation } from "@ledgerhq/live-common/operation";
const mapStateToProps = createStructuredSelector({
  confirmationsNb: (state, { account, parentAccount }) =>
    confirmationsNbForCurrencySelector(state, {
      currency: getMainAccount(account, parentAccount).currency,
    }),
});
const OperationRow: ThemedComponent<{}> = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
}))`
  border-bottom: 1px solid ${p => p.theme.colors.palette.divider};
  height: 68px;
  opacity: ${p => (p.isOptimistic ? 0.5 : 1)};
  cursor: pointer;

  &:hover {
    background: ${p => rgba(p.theme.colors.wallet, 0.04)};
  }
`;
type OwnProps = {
  operation: Operation;
  account: AccountLike;
  parentAccount?: Account;
  onOperationClick: (operation: Operation, account: AccountLike, parentAccount?: Account) => void;
  t: TFunction;
  withAccount: boolean;
  withAddress: boolean;
  text?: string;
};
type Props = {
  confirmationsNb: number;
} & OwnProps;
class OperationComponent extends PureComponent<Props> {
  static defaultProps = {
    withAccount: false,
    withAddress: true,
  };

  onOperationClick = () => {
    const { account, parentAccount, onOperationClick, operation } = this.props;
    onOperationClick(operation, account, parentAccount);
  };

  render() {
    const {
      account,
      parentAccount,
      t,
      operation,
      withAccount,
      text,
      withAddress,
      confirmationsNb,
    } = this.props;
    const isOptimistic = operation.blockHeight === null;
    const currency = getAccountCurrency(account);
    const unit = getAccountUnit(account);
    const mainAccount = getMainAccount(account, parentAccount);
    const isConfirmed = isConfirmedOperation(operation, mainAccount, confirmationsNb);
    return (
      <OperationRow
        className="operation-row"
        isOptimistic={isOptimistic}
        onClick={this.onOperationClick}
      >
        <ConfirmationCell
          operation={operation}
          parentAccount={parentAccount}
          account={account}
          t={t}
          isConfirmed={isConfirmed}
        />
        <DateCell text={text} operation={operation} t={t} />
        {withAccount && <AccountCell accountName={getAccountName(account)} currency={currency} />}
        {withAddress ? <AddressCell operation={operation} /> : <Box flex="1" />}
        <AmountCell
          operation={operation}
          currency={currency}
          unit={unit}
          isConfirmed={isConfirmed}
        />
      </OperationRow>
    );
  }
}
const ConnectedOperationComponent: React$ComponentType<OwnProps> = connect(mapStateToProps)(
  OperationComponent,
);
export default ConnectedOperationComponent;
