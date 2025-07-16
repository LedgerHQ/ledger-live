import React, { memo, useCallback, useMemo } from "react";

import { ScreenName } from "~/const";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { useHideSpamCollection } from "~/hooks/nfts/useHideSpamCollection";
import { OperationListV1 } from "./OperationsV1";
import { OperationListV2 } from "./OperationsV2";
import { AccountLikeArray } from "@ledgerhq/types-live";
import { useFocusEffect } from "@react-navigation/core";
import { useSelector } from "react-redux";
import { useRefreshAccountsOrdering } from "~/actions/general";
import { flattenAccountsSelector } from "~/reducers/accounts";

type Props = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.AnalyticsOperations>;

export function Operations({ navigation, route }: Props) {
  const accountsIds = route?.params?.accountsIds;
  const { enabled: spamFilteringTxEnabled } = useHideSpamCollection();

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

  return spamFilteringTxEnabled ? (
    <OperationListV2
      accountsFiltered={accountsFiltered}
      allAccounts={allAccounts}
      onTransactionButtonPress={onTransactionButtonPress}
    />
  ) : (
    <OperationListV1
      accountsFiltered={accountsFiltered}
      allAccounts={allAccounts}
      onTransactionButtonPress={onTransactionButtonPress}
    />
  );
}

export default withDiscreetMode(memo<Props>(Operations));
