import React, { useState } from "react";

import { OperationsList } from "./OperationsList";
import { useOperationsV1 } from "./useOperationsV1";
import { Props } from "./types";
import ShowHiddenSmallValueTransactionsToggle from "~/components/ShowHiddenSmallValueTransactionsToggle";
import { useSelector } from "~/context/hooks";
import { filterTokenOperationsZeroAmountEnabledSelector } from "~/reducers/settings";

export function OperationListV1({
  accountsFiltered,
  allAccounts,
  onTransactionButtonPress,
}: Props) {
  const [opCount, setOpCount] = useState(50);
  const [showHiddenSmallValueOperations, setShowHiddenSmallValueOperations] = useState(false);
  const isSmallValueFilterEnabled = useSelector(filterTokenOperationsZeroAmountEnabledSelector);
  const effectiveShowHiddenSmallValueOperations =
    isSmallValueFilterEnabled && showHiddenSmallValueOperations;

  function onEndReached() {
    setOpCount(opCount + 50);
  }

  const { sections, completed } = useOperationsV1(accountsFiltered, opCount, {
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
      <OperationsList
        onEndReached={onEndReached}
        onTransactionButtonPress={onTransactionButtonPress}
        accountsFiltered={accountsFiltered}
        allAccounts={allAccounts}
        completed={completed}
        sections={sections}
      />
    </>
  );
}
