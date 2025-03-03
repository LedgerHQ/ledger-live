import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { OperationsHistoryList } from "./OperationsHistoryList";
import { useOperationsV1 } from "~/screens/Analytics/Operations/useOperationsV1";
import { Props } from "./types";

const OperationsHistoryV1 = ({ accounts, testID, opCount, goToAnalyticsOperations }: Props) => {
  const { t } = useTranslation();

  const { completed, sections } = useOperationsV1(accounts, opCount);

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
