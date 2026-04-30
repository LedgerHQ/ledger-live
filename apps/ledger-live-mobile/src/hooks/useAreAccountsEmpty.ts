import { useState, useEffect } from "react";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";

export function useAreAccountsEmpty(): boolean {
  const accounts = useSelector(accountsSelector);
  const [areEmpty, setAreEmpty] = useState(true);

  useEffect(() => {
    if (accounts.length === 0) {
      setAreEmpty(true);
      return;
    }
    Promise.all(accounts.map(isAccountEmpty)).then(results =>
      setAreEmpty(results.every(Boolean)),
    );
  }, [accounts]);

  return areEmpty;
}
