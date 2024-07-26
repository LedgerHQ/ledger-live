import React from "react";
import Box from "~/renderer/components/Box";
import { Account, AccountLike, PortfolioRange } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import styled from "styled-components";
import Header from "~/renderer/screens/accounts/AccountRowItem/Header";
import Balance from "~/renderer/screens/accounts/AccountRowItem/Balance";
import Delta from "~/renderer/screens/accounts/AccountRowItem/Delta";
import Countervalue from "~/renderer/screens/accounts/AccountRowItem/Countervalue";
import Star from "~/renderer/components/Stars/Star";
import { TableRow } from "./TableContainer";
import { useAccountUnit } from "../hooks/useAccountUnit";
type Props = {
  account: AccountLike;
  nested?: boolean;
  disableRounding?: boolean;
  parentAccount: Account;
  onClick: (b: AccountLike, a: Account) => void;
  range: PortfolioRange;
};
const NestedRow = styled(Box)`
  flex: 1;
  font-weight: 600;
  align-items: center;
  justify-content: flex-start;
  display: flex;
  flex-direction: row;
  cursor: pointer;
  position: relative;
  margin: 0 -20px;
  padding: 0 20px;
  &:last-of-type {
    margin-bottom: 0px;
  }
  :active {
    background: ${p => p.theme.colors.palette.action.hover};
  }
`;
function TokenRow(props: Props) {
  const { account, parentAccount, onClick, range, nested, disableRounding } = props;
  const onClickRow = () => onClick(account, parentAccount);
  const unit = useAccountUnit(account);
  const currency = getAccountCurrency(account);
  const Row = nested ? NestedRow : TableRow;
  return (
    <Row
      data-testid={`token-row-${currency.ticker}`}
      className="token-row"
      onClick={onClickRow}
      tabIndex={-1}
    >
      <Header nested={nested} account={account} />
      <Balance unit={unit} balance={account.balance} disableRounding={disableRounding} />
      <Countervalue account={account} currency={currency} range={range} />
      <Delta account={account} range={range} />
      <Star accountId={account.id} />
    </Row>
  );
}
export default React.memo(TokenRow);
