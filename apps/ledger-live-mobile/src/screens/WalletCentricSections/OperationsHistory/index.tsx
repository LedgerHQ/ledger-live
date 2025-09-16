import React, { memo, useCallback } from "react";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import OperationsHistoryV1 from "./OperationsHistoryV1";
import { useNavigation } from "@react-navigation/core";
import { track } from "~/analytics";
import { ScreenName } from "~/const";
import { InitialProps } from "./types";

const NB_OPERATIONS_TO_DISPLAY = 3;

const OperationsHistory = ({ accounts, testID }: InitialProps) => {
  const navigation = useNavigation();

  const goToAnalyticsOperations = useCallback(() => {
    track("button_clicked", {
      button: "See All Transactions",
    });
    navigation.navigate(ScreenName.AnalyticsOperations, {
      accountsIds: accounts.map(account => account.id),
    });
  }, [navigation, accounts]);

  return (
    <OperationsHistoryV1
      accounts={accounts}
      opCount={NB_OPERATIONS_TO_DISPLAY}
      testID={testID}
      goToAnalyticsOperations={goToAnalyticsOperations}
    />
  );
};

export default withDiscreetMode(memo<InitialProps>(OperationsHistory));
