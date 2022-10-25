import React, { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  accountWithMandatoryTokens,
  flattenAccounts,
} from "@ledgerhq/live-common/account/helpers";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Flex } from "@ledgerhq/native-ui";
import {
  isAccountEmpty,
  getAccountSpendableBalance,
} from "@ledgerhq/live-common/account/index";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { ScreenName } from "../const";
import { accountsSelector } from "../reducers/accounts";
import { TrackScreen } from "../analytics";
import AccountSelector from "../components/AccountSelector";
import GenericErrorBottomModal from "../components/GenericErrorBottomModal";

type Props = {
  navigation: any;
  route: {
    params?: {
      currency?: string;
      selectedCurrency?: CryptoCurrency | TokenCurrency;
      next: string;
      category: string;
      notEmptyAccounts?: boolean;
      minBalance?: number;
    };
  };
};

export default function ReceiveFunds({ navigation, route }: Props) {
  const {
    selectedCurrency,
    currency: initialCurrencySelected,
    next,
    category,
    notEmptyAccounts,
    minBalance,
  } = route.params || {};

  const [error, setError] = useState<Error | undefined>();

  const accounts = useSelector(accountsSelector);
  const enhancedAccounts = useMemo(() => {
    if (selectedCurrency) {
      const filteredAccounts = accounts.filter(
        acc =>
          acc.currency.id ===
          (selectedCurrency.type === "TokenCurrency"
            ? selectedCurrency.parentCurrency.id
            : selectedCurrency.id),
      );
      if (selectedCurrency.type === "TokenCurrency") {
        // add in the token subAccount if it does not exist
        return flattenAccounts(
          filteredAccounts.map(acc =>
            accountWithMandatoryTokens(acc, [selectedCurrency]),
          ),
        ).filter(
          acc =>
            acc.type === "Account" ||
            (acc.type === "TokenAccount" &&
              acc.token.id === selectedCurrency.id),
        );
      }
      return flattenAccounts(filteredAccounts);
    }
    return flattenAccounts(accounts);
  }, [accounts, selectedCurrency]);
  const allAccounts = notEmptyAccounts
    ? enhancedAccounts.filter(account => !isAccountEmpty(account))
    : enhancedAccounts;

  const handleSelectAccount = useCallback(
    account => {
      const balance = getAccountSpendableBalance(account);

      if (!isNaN(minBalance) && balance.lte(minBalance)) {
        setError(new NotEnoughBalance());
      } else {
        navigation.navigate(next || ScreenName.ReceiveConnectDevice, {
          ...route.params,
          account,
          accountId: account.id,
          parentId: account.type !== "Account" ? account.parentId : undefined,
        });
      }
    },
    [minBalance, navigation, next, route.params],
  );

  return (
    <Flex flex={1} color="background.main">
      <TrackScreen category={category} name="SelectAccount" />
      <Flex p={6}>
        <AccountSelector
          list={allAccounts}
          onSelectAccount={handleSelectAccount}
          initialCurrencySelected={initialCurrencySelected}
        />
      </Flex>
      {error ? (
        <GenericErrorBottomModal
          error={error}
          onClose={() => setError(undefined)}
        />
      ) : null}
    </Flex>
  );
}
