import useStakeFlow from "~/renderer/screens/stake";
import { useHistory, useLocation } from "react-router-dom";
import { useEffect } from "react";

/**
 * Valid URLs that this hook will listen for and handle:
 * ledgerlive://earn?action=get-funds&currencyId=ethereum - this will open a modal to get funds
 * ledgerlive://earn?action=stake - this will launch the staking flow
 */
export const useDeepLinkListener = () => {
  const startStakeFlow = useStakeFlow();
  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const action = queryParams.get("action");

    if (!action) {
      return;
    }

    switch (action) {
      case "stake":
        startStakeFlow({ shouldRedirect: false });
        break;
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
  }, [history, location.search, startStakeFlow]);
};
