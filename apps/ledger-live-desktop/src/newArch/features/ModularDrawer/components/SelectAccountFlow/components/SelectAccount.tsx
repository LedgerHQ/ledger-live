import React from "react";
import { track } from "~/renderer/analytics/segment";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Box, Flex } from "@ledgerhq/react-ui/index";
import { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { AccountList, Account as DetailedAccount } from "@ledgerhq/react-ui/pre-ldls/index";
import { AccountTuple } from "~/renderer/components/PerCurrencySelectAccount/state";
import { ACCOUNT_PAGE, EXTRA_BOTTOM_MARGIN } from "./constants";
import { useBatchMaybeAccountName } from "~/renderer/reducers/wallet";

type SelectAccountProps = {
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
  accounts: AccountTuple[];
  source: string;
  flow: string;
  detailedAccounts: DetailedAccount[];
};

export const SelectAccount = ({
  detailedAccounts,
  accounts,
  onAccountSelected,
  source,
  flow,
}: SelectAccountProps) => {
  const trackAccountClick = (ticker: string) => {
    track("account_clicked", {
      currency: ticker,
      page: "Modular Account Selection",
      flow,
    });
  };

  const onAccountClick = (accountId: string) => {
    const currencyAccount = accounts.find(({ account }) => account.id === accountId);

    if (currencyAccount) {
      onAccountSelected(currencyAccount.account);
      trackAccountClick(currencyAccount.account.currency.ticker);
    } else {
      let tokenAccount: TokenAccount | undefined;
      let parentAccount: Account | undefined;

      for (const { account } of accounts) {
        tokenAccount = account.subAccounts?.find(({ id }) => id === accountId);
        if (tokenAccount) {
          parentAccount = accounts.find(
            ({ account }) => account.id === tokenAccount?.parentId,
          )?.account;
          break;
        }
      }

      if (tokenAccount && parentAccount) {
        onAccountSelected(tokenAccount, parentAccount);
        trackAccountClick(tokenAccount.token.ticker);
      }
    }
  };

  const overridedAccountName = useBatchMaybeAccountName(accounts.map(({ account }) => account));

  const detailedAccountsWithName = detailedAccounts.map((account, index) => {
    const accountName = overridedAccountName[index];
    return {
      ...account,
      name: accountName ?? account.name,
    };
  });

  return (
    <Box style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TrackPage category={source} name={ACCOUNT_PAGE} flow={flow} />
      <Flex
        style={{
          flex: "1",
          overflow: "auto",
          paddingBottom: `${EXTRA_BOTTOM_MARGIN}px`,
        }}
      >
        <AccountList accounts={detailedAccountsWithName} onClick={onAccountClick} />
      </Flex>
    </Box>
  );
};
