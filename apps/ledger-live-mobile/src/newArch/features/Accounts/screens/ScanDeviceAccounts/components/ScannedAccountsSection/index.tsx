import React, { useEffect, useRef } from "react";
import SelectableAccountsList from "~/components/SelectableAccountsList";

const ScannedAccountsSection = ({
  defaultSelected,
  ...rest
}: {
  defaultSelected?: boolean;
} & React.ComponentProps<typeof SelectableAccountsList>): JSX.Element => {
  const { onSelectAll, accounts } = rest;

  /**
   * unlike legacy implementation here (apps/ledger-live-mobile/src/screens/AddAccounts/03-Accounts.tsx) deleting eslint-disable-next-line react-hooks/exhaustive-deps provoked a maximum update depth error
   * so we will use a call flag to prevent calling onSelectAll multiple times
   * */
  const hasCalledOnSelectAll = useRef(false);
  useEffect(() => {
    if (defaultSelected && onSelectAll && !hasCalledOnSelectAll.current) {
      onSelectAll(accounts, true);
      hasCalledOnSelectAll.current = true; // to prevent maximum update depth error
    }
  }, [defaultSelected, accounts, onSelectAll]);
  return <SelectableAccountsList useFullBalance {...rest} />;
};

export default ScannedAccountsSection;
