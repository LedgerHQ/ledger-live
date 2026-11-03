import { setEnvUnsafe } from "@shared/env";
import { getMockServerSecureChannelUrl } from "@ledgerhq/live-dmk-shared";
import { useEffect } from "react";
import { useSelector } from "~/context/hooks";
import {
  filterTokenOperationsZeroAmountEnabledSelector,
  hideEmptyTokenAccountsEnabledSelector,
  mockServerConfigSelector,
} from "../reducers/settings";

const SetEnvsFromSettings = () => {
  const hideEmptyTokenAccountsEnabled = useSelector(hideEmptyTokenAccountsEnabledSelector);
  const filterTokenOperationsZeroAmountEnabled = useSelector(
    filterTokenOperationsZeroAmountEnabledSelector,
  );
  const mockServerConfig = useSelector(mockServerConfigSelector);

  useEffect(() => {
    setEnvUnsafe("HIDE_EMPTY_TOKEN_ACCOUNTS", hideEmptyTokenAccountsEnabled);
  }, [hideEmptyTokenAccountsEnabled]);

  useEffect(() => {
    setEnvUnsafe("FILTER_ZERO_AMOUNT_ERC20_EVENTS", filterTokenOperationsZeroAmountEnabled);
  }, [filterTokenOperationsZeroAmountEnabled]);

  useEffect(() => {
    const secureChannelUrl =
      mockServerConfig &&
      getMockServerSecureChannelUrl(mockServerConfig.url, mockServerConfig.token);
    if (secureChannelUrl) setEnvUnsafe("BASE_SOCKET_URL", secureChannelUrl);
  }, [mockServerConfig]);

  return null;
};

export default SetEnvsFromSettings;
