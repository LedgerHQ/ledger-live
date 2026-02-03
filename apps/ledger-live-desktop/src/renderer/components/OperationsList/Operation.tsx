import React from "react";
import { useSelector } from "LLD/hooks/redux";
import styled from "styled-components";
import { rgba } from "~/renderer/styles/helpers";
import Box from "~/renderer/components/Box";
import { TFunction } from "i18next";
import { AccountLike, Account, Operation } from "@ledgerhq/types-live";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import ConfirmationCell from "./ConfirmationCell";
import DateCell from "./DateCell";
import AccountCell from "./AccountCell";
import AddressCell from "./AddressCell";
import AmountCell from "./AmountCell";
import { confirmationsNbForCurrencySelector } from "~/renderer/reducers/settings";
import { isConfirmedOperation } from "@ledgerhq/live-common/operation";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { State } from "~/renderer/reducers";
import { useAccountName } from "~/renderer/reducers/wallet";
import { getLLDCoinFamily } from "~/renderer/families";

const OperationRow = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
}))<{ isOptimistic: boolean }>`
  border-bottom: 1px solid ${p => p.theme.colors.neutral.c40};
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
  withAccount?: boolean;
  withAddress?: boolean;
  text?: string;
  editable?: boolean;
};
type Props = OwnProps;

function OperationComponent({
  operation,
  account,
  parentAccount,
  onOperationClick,
  t,
  text,
  editable,
  withAddress = true,
  withAccount = false,
}: Props) {
  const mainAccount = getMainAccount(account, parentAccount);
  const confirmationsNb = useSelector((state: State) =>
    confirmationsNbForCurrencySelector(state, mainAccount),
  );
  const unit = useAccountUnit(account);
  const accountName = useAccountName(account);

  const onClickOnOperation = () => {
    onOperationClick(operation, account, parentAccount);
  };

  const isOptimistic = operation.blockHeight === null;
  const currency = getAccountCurrency(account);

  const isConfirmed = isConfirmedOperation(operation, mainAccount, confirmationsNb);

  const cryptoCurrency = currency.type === "CryptoCurrency" ? currency : currency.parentCurrency;
  const specific = getLLDCoinFamily(cryptoCurrency.family);
  const CustomMetadataCell = specific ? specific.CustomMetadataCell : null;

  return (
    <OperationRow
      isOptimistic={isOptimistic}
      onClick={onClickOnOperation}
      data-testid={`operation-row-${operation.id}`}
    >
      <ConfirmationCell
        operation={operation}
        parentAccount={parentAccount}
        account={account}
        t={t}
        isConfirmed={isConfirmed}
      />
      <DateCell
        family={mainAccount.currency.family}
        text={text}
        operation={operation}
        editable={editable}
        t={t}
      />
      {withAccount && <AccountCell accountName={accountName} currency={currency} />}
      {withAddress ? <AddressCell operation={operation} currency={currency} /> : <Box flex="1" />}
      {CustomMetadataCell && <CustomMetadataCell operation={operation} />}
      <AmountCell operation={operation} currency={currency} unit={unit} isConfirmed={isConfirmed} />
    </OperationRow>
  );
}
export default React.memo(OperationComponent);
