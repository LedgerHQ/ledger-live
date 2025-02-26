import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { AccountLike, AccountLikeArray, Operation } from "@ledgerhq/types-live";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { ScreenName } from "~/const";
import { track } from "~/analytics";
import { OperationsHistoryList } from "./operationsHistoryList";
import { groupAccountsOperationsByDay } from "@ledgerhq/coin-framework/lib/account/groupOperations";
import { isAddressPoisoningOperation } from "@ledgerhq/coin-framework/lib/operation";
import { useNftCollectionsStatus } from "~/hooks/nfts/useNftCollectionsStatus";
import { filterTokenOperationsZeroAmountEnabledSelector } from "~/reducers/settings";

type Props = {
  accounts: AccountLikeArray;
  testID?: string;
  opCount: number;
};

const OperationsHistoryV1 = ({ accounts, testID, opCount }: Props) => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const goToAnalyticsOperations = useCallback(() => {
    track("button_clicked", {
      button: "See All Transactions",
    });
    navigation.navigate(ScreenName.AnalyticsOperations, {
      accountsIds: accounts.map(account => account.id),
    });
  }, [navigation, accounts]);

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

  const { sections, completed } = groupAccountsOperationsByDay(accounts, {
    count: opCount,
    withSubAccounts: true,
    filterOperation,
  });

  return (
    <OperationsHistoryList
      goToAnalyticsOperations={goToAnalyticsOperations}
      accounts={accounts}
      sections={sections}
      completed={completed}
      testID={testID}
      t={t}
    />
  );
};

export default withDiscreetMode(memo<Props>(OperationsHistoryV1));
