import React, { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { AccountLike } from "@ledgerhq/types-live";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import NoResultsFound from "~/icons/NoResultsFound";
import AccountList from "./AccountList";
import FilteredSearchBar from "./FilteredSearchBar";
import { formatSearchResults } from "~/helpers/formatAccountSearchResults";
import { accountsSelector } from "~/reducers/accounts";
import { walletSelector } from "~/reducers/wallet";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";

const SEARCH_KEYS = [
  "name",
  "account.currency.units[0].code",
  "account.token.name",
  "account.token.ticker",
];

type Props = {
  list: AccountLike[];
  onSelectAccount: (_: AccountLike) => void;
  showAddAccount?: boolean;
  onAddAccount?: () => void;
  initialCurrencySelected?: string;
};

const AccountSelector = ({
  list,
  onSelectAccount,
  showAddAccount,
  onAddAccount,
  initialCurrencySelected,
}: Props) => {
  const { t } = useTranslation();
  const accounts = useSelector(accountsSelector);
  const walletState = useSelector(walletSelector);

  const items = useMemo(() => {
    return list.map(account => ({
      account,
      name: accountNameWithDefaultSelector(walletState, account),
    }));
  }, [list, walletState]);

  const renderEmptySearch = useCallback(
    () => (
      <Flex alignItems="center" justifyContent="center" pb="50px" pt="30px">
        <NoResultsFound />
        <Text color="neutral.c100" fontWeight="medium" variant="h2" mt={6} textAlign="center">
          {t("transfer.receive.noResultsFound")}
        </Text>
        <Flex>
          <Text color="neutral.c80" fontWeight="medium" variant="body" pt={6} textAlign="center">
            {t("transfer.receive.noResultsDesc")}
          </Text>
        </Flex>
      </Flex>
    ),
    [t],
  );

  const renderList = useCallback(
    (items: { account: AccountLike }[]) => {
      const formatedList = formatSearchResults(
        items.map(a => a.account),
        accounts,
      );
      return (
        <AccountList
          list={formatedList}
          showAddAccount={showAddAccount}
          onPress={onSelectAccount}
          onAddAccount={onAddAccount}
        />
      );
    },
    [showAddAccount, onSelectAccount, onAddAccount, accounts],
  );

  return (
    <FilteredSearchBar
      keys={SEARCH_KEYS}
      list={items}
      renderList={renderList}
      initialQuery={initialCurrencySelected}
      renderEmptySearch={renderEmptySearch}
    />
  );
};

export default AccountSelector;
