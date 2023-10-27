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

  const apply = () => {
    setEnvUnsafe("HIDE_EMPTY_TOKEN_ACCOUNTS", hideEmptyTokenAccountsEnabled);
    setEnvUnsafe("FILTER_ZERO_AMOUNT_ERC20_EVENTS", filterTokenOperationsZeroAmountEnabled);
  };

  useEffect(() => apply());

  return null;
};

export default SetEnvsFromSettings;
