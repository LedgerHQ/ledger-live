import React, { useMemo, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { AccountLikeArray } from "@ledgerhq/types-live";

import { useRefreshAccountsOrdering } from "~/actions/general";
import { flattenAccountsSelector } from "~/reducers/accounts";

import { ScreenName } from "~/const";
import { useOperations } from "./useOperations";
import { OperationsList } from "./operationsList";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type Props = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.AnalyticsOperations>;

export function OperationListV2({ navigation, route }: Props) {
  const accountsIds = route?.params?.accountsIds;
  const [opCount, setOpCount] = useState(50);
  const [skipOp, setSkipOp] = useState(0);

  function onEndReached() {
    setOpCount(opCount + 50);
    setSkipOp(opCount);
  }

  const accountsFromState = useSelector(flattenAccountsSelector);
  const accountsFiltered = useMemo(
    () =>
      accountsIds
        ? accountsFromState.filter(account => accountsIds.includes(account.id))
        : accountsFromState,
    [accountsFromState, accountsIds],
  );
  const allAccounts: AccountLikeArray = useSelector(flattenAccountsSelector);

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const onTransactionButtonPress = useCallback(() => {
    navigation.navigate(ScreenName.PortfolioOperationHistory);
  }, [navigation]);

  const { sections, completed } = useOperations({
    accounts: accountsFiltered,
    opCount,
    withSubAccounts: true,
    skipOp,
  });

  return (
    <OperationsList
      onEndReached={onEndReached}
      onTransactionButtonPress={onTransactionButtonPress}
      accountsFiltered={accountsFiltered}
      allAccounts={allAccounts}
      completed={completed}
      sections={sections}
    />
  );
}
