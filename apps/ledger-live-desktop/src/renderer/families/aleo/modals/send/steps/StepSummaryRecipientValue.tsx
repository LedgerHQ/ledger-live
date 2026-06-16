import React from "react";
import styled from "styled-components";
import { isSelfTransferTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
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
  const mainAccount = getMainAccount(account, parentAccount);
  const currencyId = mainAccount.currency.id;
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

  const isSelfTransfer = isSelfTransferTransaction(transaction);

  // For self-transfers the sender IS the recipient - fall back to mainAccount when no address match
  const recipientAccount: Account | undefined = isSelfTransfer
    ? (matchingRecipientAccount ?? mainAccount)
    : matchingRecipientAccount;

  const recipientAccountName = useMaybeAccountName(recipientAccount);

  const isTokenAccount = account.type === "TokenAccount";
  const displayCurrency = isTokenAccount ? account.token : recipientAccount?.currency;
  const displayName = isTokenAccount ? account.token.name : recipientAccountName;

  const shouldShowAccountName =
    isSelfTransfer && !!displayName && (isTokenAccount || !!recipientAccount);

  if (shouldShowAccountName) {
    return (
      <Box horizontal alignItems="center" style={{ minWidth: 0 }}>
        {displayCurrency && (
          <RecipientIconWrapper>
            <CryptoCurrencyIcon size={22} currency={displayCurrency} />
          </RecipientIconWrapper>
        )}
        <Ellipsis ff="Inter" color="neutral.c100" fontSize={4} data-testid="recipient-address">
          {displayName}
        </Ellipsis>
        <StepSummaryAddressBadge transaction={transaction} direction="to" />
        {recipientAccount && <AccountTagDerivationMode account={recipientAccount} />}
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
      {transaction.recipient}
    </Ellipsis>
  );
};

export default StepSummaryRecipientValue;
