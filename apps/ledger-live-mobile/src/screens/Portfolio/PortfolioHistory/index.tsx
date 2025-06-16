import React, { memo, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";

import { useRefreshAccountsOrdering } from "~/actions/general";
import { accountsSelector, flattenAccountsSelector } from "~/reducers/accounts";

import { ScreenName } from "~/const";
import { track } from "~/analytics";
import { useHideSpamCollection } from "~/hooks/nfts/useHideSpamCollection";
import PortfolioHistoryListWithoutSpams from "./PortfolioHistoryV2";
import { PortfolioHistoryList } from "./PortfolioHistoryV1";
import { Props } from "./types";

function PortfolioHistory({ navigation }: Props) {
  const { enabled: spamFilteringTxEnabled } = useHideSpamCollection();

  const [opCount, setOpCount] = useState(50);
  const [skipOp, setSkipOp] = useState(0);

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

  return spamFilteringTxEnabled ? (
    <PortfolioHistoryListWithoutSpams
      accounts={accounts}
      allAccounts={allAccounts}
      onTransactionButtonPress={onTransactionButtonPress}
      onEndReached={onEndReached}
      opCount={opCount}
      skipOp={skipOp}
    />
  ) : (
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
