import React, { useMemo, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { AccountLike, AccountLikeArray, Operation } from "@ledgerhq/types-live";

import { useRefreshAccountsOrdering } from "~/actions/general";
import { flattenAccountsSelector } from "~/reducers/accounts";

import { ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { groupAccountsOperationsByDay } from "@ledgerhq/live-common/account/index";
import { isAddressPoisoningOperation } from "@ledgerhq/coin-framework/lib/operation";
import { useNftCollectionsStatus } from "~/hooks/nfts/useNftCollectionsStatus";
import { filterTokenOperationsZeroAmountEnabledSelector } from "~/reducers/settings";
import { OperationsList } from "./operationsList";

type Props = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.AnalyticsOperations>;

export function OperationListV1({ navigation, route }: Props) {
  const accountsIds = route?.params?.accountsIds;
  const [opCount, setOpCount] = useState(50);

  function onEndReached() {
    setOpCount(opCount + 50);
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

  const { hiddenNftCollections } = useNftCollectionsStatus();
  const shouldFilterTokenOpsZeroAmount = useSelector(
    filterTokenOperationsZeroAmountEnabledSelector,
  );

  const filterOperation = useCallback(
    (operation: Operation, account: AccountLike) => {
      // Remove operations linked to address poisoning
      const removeZeroAmountTokenOp =
        shouldFilterTokenOpsZeroAmount && isAddressPoisoningOperation(operation, account);
      // Remove operations coming from an NFT collection considered spam
      const opFromBlacklistedNftCollection = operation?.nftOperations?.find(op =>
        hiddenNftCollections.includes(`${account.id}|${op?.contract}`),
      );
      return !opFromBlacklistedNftCollection && !removeZeroAmountTokenOp;
    },
    [hiddenNftCollections, shouldFilterTokenOpsZeroAmount],
  );

  const { sections, completed } = groupAccountsOperationsByDay(accountsFiltered, {
    count: opCount,
    withSubAccounts: true,
    filterOperation,
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
