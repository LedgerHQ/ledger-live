import React, { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { accountWithMandatoryTokens, flattenAccounts } from "@ledgerhq/live-common/account/helpers";
import { Flex } from "@ledgerhq/native-ui";
import { isAccountEmpty, getAccountSpendableBalance } from "@ledgerhq/live-common/account/index";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { ScreenName } from "~/const";
import { accountsSelector } from "~/reducers/accounts";
import { TrackScreen } from "~/analytics";
import AccountSelector from "~/components/AccountSelector";
import GenericErrorBottomModal from "~/components/GenericErrorBottomModal";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import SafeAreaView from "~/components/SafeAreaView";
import { AccountLike } from "@ledgerhq/types-live";

type Props = StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendCoin>;

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
          filteredAccounts.map(acc => accountWithMandatoryTokens(acc, [selectedCurrency])),
        ).filter(
          acc =>
            acc.type === "Account" ||
            (acc.type === "TokenAccount" && acc.token.id === selectedCurrency.id),
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
    (account: AccountLike) => {
      const balance = getAccountSpendableBalance(account);

      if (typeof minBalance !== "undefined" && !isNaN(minBalance) && balance.lte(minBalance)) {
        setError(new NotEnoughBalance());
      } else {
        // FIXME: Double check if this works because it seems very weird.
        // 1) "next" does not seem to be passed as a param anywhere
        // 2) This component belongs to "SendFundsNavigator", but ReceiveConnectDevice does not.
        //    It belongs to "ReceiveFundsNavigator".
        // Update: next is never passed as a dynamic param, it is only defined as an initial param
        // Thus, next is always defined and the || condition seems to be kinda stupid.
        // @ts-expect-error this seems impossible to type correctly…
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
    <SafeAreaView isFlex edges={["left", "right"]}>
      <TrackScreen category={category || ""} name="SelectAccount" />
      <Flex m={6} style={{ flex: 1 }}>
        <AccountSelector
          list={allAccounts}
          onSelectAccount={handleSelectAccount}
          initialCurrencySelected={initialCurrencySelected}
        />
      </Flex>
      {error ? <GenericErrorBottomModal error={error} onClose={() => setError(undefined)} /> : null}
    </SafeAreaView>
  );
}
