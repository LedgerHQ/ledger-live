import React, { memo, useCallback } from "react";
import { TFunction, useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { AccountLikeArray, DailyOperationsSection } from "@ledgerhq/types-live";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { ScreenName } from "~/const";
import { track } from "~/analytics";
import { useOperations } from "~/screens/Analytics/Operations/useOperations";
import { OperationsHistoryList } from "./operationsHistoryList";

type ViewProps = {
  accounts: AccountLikeArray;
  testID?: string;
  sections: DailyOperationsSection[];
  completed: boolean;
  goToAnalyticsOperations: () => void;
  t: TFunction;
};

type Props = {
  accounts: AccountLikeArray;
  testID?: string;
  opCount: number;
  skipOp: number;
};

const useOperationsViewModel = ({ accounts, opCount, skipOp }: Props) => {
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

  const { sections, completed } = useOperations({
    accounts,
    opCount,
    skipOp,
    withSubAccounts: true,
  });

  return {
    sections,
    completed,
    goToAnalyticsOperations,
    t,
  };
};

const View = ({ accounts, testID, sections, completed, goToAnalyticsOperations, t }: ViewProps) => {
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

const OperationsHistoryV2 = ({ accounts, skipOp, opCount, testID }: Props) => {
  return (
    <View
      accounts={accounts}
      testID={testID}
      {...useOperationsViewModel({ accounts, opCount, skipOp })}
    />
  );
};

export default withDiscreetMode(memo<Props>(OperationsHistoryV2));
