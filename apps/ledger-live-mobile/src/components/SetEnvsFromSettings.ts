import { setEnvUnsafe } from "@ledgerhq/live-env";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import {
  filterTokenOperationsZeroAmountEnabledSelector,
  hideEmptyTokenAccountsEnabledSelector,
} from "../reducers/settings";

const SetEnvsFromSettings = () => {
  const hideEmptyTokenAccountsEnabled = useSelector(hideEmptyTokenAccountsEnabledSelector);
  const filterTokenOperationsZeroAmountEnabled = useSelector(
    filterTokenOperationsZeroAmountEnabledSelector,
  );

  useEffect(() => {
    setEnvUnsafe("HIDE_EMPTY_TOKEN_ACCOUNTS", hideEmptyTokenAccountsEnabled);
  }, [hideEmptyTokenAccountsEnabled]);

  useEffect(() => {
    setEnvUnsafe("FILTER_ZERO_AMOUNT_ERC20_EVENTS", filterTokenOperationsZeroAmountEnabled);
  }, [filterTokenOperationsZeroAmountEnabled]);

  return null;
};

export default SetEnvsFromSettings;
