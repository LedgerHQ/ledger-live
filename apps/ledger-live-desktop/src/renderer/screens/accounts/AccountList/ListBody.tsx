import React from "react";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { PortfolioRange } from "@ledgerhq/live-common/portfolio/v2/types";
import Box from "~/renderer/components/Box";
import AccountItem from "../AccountRowItem";
import AccountItemPlaceholder from "../AccountRowItem/Placeholder";
type Props = {
  visibleAccounts: Account[];
  hiddenAccounts: Account[];
  onAccountClick: (a: AccountLike) => void;
  lookupParentAccount: (id: string) => Account | undefined | null;
  range: PortfolioRange;
  showNewAccount: boolean;
  search?: string;
};
const ListBody = ({
  visibleAccounts,
  showNewAccount,
  hiddenAccounts,
  range,
  onAccountClick,
  lookupParentAccount,
  search,
}: Props) => (
  <Box id="accounts-list">
    {[...visibleAccounts, ...(showNewAccount ? [null] : []), ...hiddenAccounts].map((account, i) =>
      !account ? (
        <AccountItemPlaceholder key="placeholder" />
      ) : (
        <AccountItem
          hidden={i >= visibleAccounts.length}
          key={account.id}
          account={account}
          search={search}
          parentAccount={account.type !== "Account" ? lookupParentAccount(account.parentId) : null}
          range={range}
          onClick={onAccountClick}
        />
      ),
    )}
  </Box>
);
export default ListBody;
