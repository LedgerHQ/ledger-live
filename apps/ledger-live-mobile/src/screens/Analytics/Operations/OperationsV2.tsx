import React, { useState } from "react";

import { useOperationsV2 } from "./useOperationsV2";
import { OperationsList } from "./OperationsList";
import { Props } from "./types";

export function OperationListV2({
  accountsFiltered,
  onTransactionButtonPress,
  allAccounts,
}: Props) {
  const [opCount, setOpCount] = useState(50);
  const [skipOp, setSkipOp] = useState(0);

  function onEndReached() {
    setOpCount(opCount + 50);
    setSkipOp(opCount);
  }

  const { sections, completed } = useOperationsV2({
    accounts: accountsFiltered,
    opCount,
    withSubAccounts: true,
    skipOp,
  });

  return (
    <OperationsList
      onEndReached={onEndReached}
      onTransactionButtonPress={onTransactionButtonPress}
      accountsFiltered={accountsFiltered}
      allAccounts={allAccounts}
      completed={completed}
      sections={sections}
    />
  );
}
