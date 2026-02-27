import React, { memo, useState } from "react";
import { useTranslation } from "~/context/Locale";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { OperationsHistoryList } from "./OperationsHistoryList";
import { useOperationsV1 } from "~/screens/Analytics/Operations/useOperationsV1";
import { Props } from "./types";
import { useSelector } from "~/context/hooks";
import { filterTokenOperationsZeroAmountEnabledSelector } from "~/reducers/settings";
import ShowHiddenSmallValueTransactionsToggle from "~/components/ShowHiddenSmallValueTransactionsToggle";

const OperationsHistoryV1 = ({ accounts, testID, opCount, goToAnalyticsOperations }: Props) => {
  const { t } = useTranslation();
  const [showHiddenSmallValueOperations, setShowHiddenSmallValueOperations] = useState(false);
  const isSmallValueFilterEnabled = useSelector(filterTokenOperationsZeroAmountEnabledSelector);
  const effectiveShowHiddenSmallValueOperations =
    isSmallValueFilterEnabled && showHiddenSmallValueOperations;

  const { completed, sections } = useOperationsV1(accounts, opCount, {
    showHiddenSmallValueOperations: effectiveShowHiddenSmallValueOperations,
  });

  return (
    <>
      {isSmallValueFilterEnabled && (
        <ShowHiddenSmallValueTransactionsToggle
          enabled={showHiddenSmallValueOperations}
          onChange={setShowHiddenSmallValueOperations}
        />
      )}
      <OperationsHistoryList
        goToAnalyticsOperations={goToAnalyticsOperations}
        accounts={accounts}
        sections={sections}
        completed={completed}
        testID={testID}
        t={t}
      />
    </>
  );
};

export default withDiscreetMode(memo<Props>(OperationsHistoryV1));
