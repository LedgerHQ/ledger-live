import React from "react";
import styled from "styled-components";
import { isSelfTransferTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import AccountTagDerivationMode from "~/renderer/components/AccountTagDerivationMode";
import Box from "~/renderer/components/Box";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import Ellipsis from "~/renderer/components/Ellipsis";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import type { AleoAccount, Transaction } from "@ledgerhq/live-common/families/aleo/types";
import StepSummaryAddressBadge from "./StepSummaryAddressBadge";

const RecipientIconWrapper = styled.div`
  margin-right: 7px;
`;

type Props = {
  account: AleoAccount | TokenAccount;
  parentAccount: AleoAccount | null | undefined;
  transaction: Transaction;
};

const StepSummaryRecipientValue = ({ account, parentAccount, transaction }: Props) => {
  const currencyId = parentAccount
    ? parentAccount.currency.id
    : account.type === "Account"
      ? account.currency.id
      : account.token.parentCurrency.id;
  const matchingRecipientAccount = useSelector((state): Account | undefined => {
    const accounts = flattenAccountsSelector(state).filter(
      (candidate): candidate is Account => candidate.type === "Account",
    );

    return accounts.find(candidate => {
      return (
        candidate.currency.id === currencyId && candidate.freshAddress === transaction.recipient
      );
    });
  });
  const matchingRecipientAccountName = useMaybeAccountName(matchingRecipientAccount);

  const shouldShowAccountName =
    isSelfTransferTransaction(transaction) &&
    Boolean(matchingRecipientAccountName) &&
    !!matchingRecipientAccount;

  if (shouldShowAccountName && matchingRecipientAccount) {
    return (
      <Box horizontal alignItems="center" style={{ minWidth: 0 }}>
        <RecipientIconWrapper>
          <CryptoCurrencyIcon size={22} currency={matchingRecipientAccount.currency} />
        </RecipientIconWrapper>
        <Ellipsis ff="Inter" color="neutral.c100" fontSize={4} data-testid="recipient-address">
          {matchingRecipientAccountName}
        </Ellipsis>
        <StepSummaryAddressBadge transaction={transaction} direction="to" />
        <AccountTagDerivationMode account={matchingRecipientAccount} />
      </Box>
    );
  }

  return (
    <Ellipsis
      ff="Inter"
      color={transaction.recipientDomain ? "neutral.c80" : "neutral.c100"}
      fontSize={4}
      data-testid="recipient-address"
    >
      {shouldShowAccountName ? matchingRecipientAccountName : transaction.recipient}
    </Ellipsis>
  );
};

export default StepSummaryRecipientValue;
