import React, { memo, useState, useCallback } from "react";
import { useSelector } from "~/context/hooks";
import { useFocusEffect } from "@react-navigation/native";

import { useRefreshAccountsOrdering } from "~/actions/general";
import { accountsSelector, flattenAccountsSelector } from "~/reducers/accounts";

import { ScreenName } from "~/const";
import { track } from "~/analytics";
import { PortfolioHistoryList } from "./PortfolioHistoryV1";
import { Props } from "./types";

function PortfolioHistory({ navigation }: Props) {
  const [opCount, setOpCount] = useState(50);
  const [_skipOp, setSkipOp] = useState(0);

  function onEndReached() {
    setOpCount(opCount + 50);
    setSkipOp(opCount);
  }

  const accounts = useSelector(accountsSelector);
  const allAccounts = useSelector(flattenAccountsSelector);

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const onTransactionButtonPress = useCallback(() => {
    track("button_clicked", {
      button: "See All Transactions",
    });
    navigation.navigate(ScreenName.PortfolioOperationHistory);
  }, [navigation]);

  return (
    <PortfolioHistoryList
      accounts={accounts}
      allAccounts={allAccounts}
      onTransactionButtonPress={onTransactionButtonPress}
      onEndReached={onEndReached}
      opCount={opCount}
    />
  );
}

export default memo<Props>(PortfolioHistory);
