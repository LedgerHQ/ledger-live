import { openModal } from "~/renderer/actions/modals";
import { accountsSelector } from "~/renderer/reducers/accounts";
import useStakeFlow from "~/renderer/screens/stake";
import { useHistory, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import logger from "~/renderer/logger";

/**
 * Valid URLs that this hook will listen for and handle:
 * ledgerlive://earn?action=get-funds&currencyId=ethereum - this will open a modal to get funds
 * ledgerlive://earn?action=stake - this will launch the staking flow
 */
export const useDeepLinkListener = () => {
  const startStakeFlow = useStakeFlow();
  const location = useLocation();
  const history = useHistory();
  const accounts = useSelector(accountsSelector);
  const dispatch = useDispatch();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const action = queryParams.get("action");

    if (!action) {
      return;
    }

    switch (action) {
      case "stake":
        startStakeFlow({ shouldRedirect: false, source: "Earn Dashboard" });
        break;
      case "stake-account": {
        const accountId = queryParams.get("accountId");
        if (accountId) {
          const id = getAccountIdFromWalletAccountId(accountId);
          const account = accounts.find(acc => acc.id === id);
          if (account) {
            dispatch(
              openModal("MODAL_START_STAKE", {
                account,
                parentAccount: undefined,
                source: "Earn Dashboard",
              }),
            );
          } else {
            logger.warn("not account found in earn dashboard deeplink");
          }
        } else {
          logger.warn("accountId query is missing for earn dashboard deeplink");
        }
        queryParams.delete("accountId");
        break;
      }
      case "get-funds": {
        const currencyId = queryParams.get("currencyId");
        if (currencyId) {
          startStakeFlow({
            shouldRedirect: false,
            currencies: [currencyId],
            alwaysShowNoFunds: true,
          });
        }
        queryParams.delete("currencyId");
        break;
      }
    }
    queryParams.delete("action");

    // reset the query params, so we don't trigger the effect again
    history.replace({
      search: queryParams.toString(),
    });
  }, [accounts, dispatch, history, location.search, startStakeFlow]);
};
