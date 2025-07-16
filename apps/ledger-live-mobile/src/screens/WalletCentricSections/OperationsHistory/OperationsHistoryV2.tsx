import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { useOperationsV2 } from "~/screens/Analytics/Operations/useOperationsV2";
import { OperationsHistoryList } from "./OperationsHistoryList";
import { Props, ViewProps } from "./types";

const useOperationsViewModel = ({ accounts, opCount, skipOp = 0 }: Props) => {
  const { t } = useTranslation();

  const { sections, completed } = useOperationsV2({
    accounts,
    opCount,
    skipOp,
    withSubAccounts: true,
  });

  return {
    sections,
    completed,
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

const OperationsHistoryV2 = ({
  accounts,
  skipOp,
  opCount,
  testID,
  goToAnalyticsOperations,
}: Props) => {
  return (
    <View
      accounts={accounts}
      testID={testID}
      goToAnalyticsOperations={goToAnalyticsOperations}
      {...useOperationsViewModel({ accounts, opCount, skipOp })}
    />
  );
};

export default withDiscreetMode(memo<Props>(OperationsHistoryV2));
