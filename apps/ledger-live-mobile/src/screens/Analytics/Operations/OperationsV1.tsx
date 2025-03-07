import React, { useState } from "react";

import { OperationsList } from "./OperationsList";
import { useOperationsV1 } from "./useOperationsV1";
import { Props } from "./types";

export function OperationListV1({
  accountsFiltered,
  allAccounts,
  onTransactionButtonPress,
}: Props) {
  const [opCount, setOpCount] = useState(50);

  function onEndReached() {
    setOpCount(opCount + 50);
  }

  const { sections, completed } = useOperationsV1(accountsFiltered, opCount);

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
