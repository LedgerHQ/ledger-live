import useStakeFlow from "~/renderer/screens/stake";
import { useHistory, useLocation } from "react-router-dom";
import { useEffect } from "react";

export const useDeepLinkListener = () => {
  const startStakeFlow = useStakeFlow();
  const location = useLocation();
  const history = useHistory();

  // looks for query params to trigger stake flow
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);

    if (!queryParams.get("action")) {
      return;
    }

    if (queryParams.get("action") === "stake") {
      startStakeFlow({ shouldRedirect: false });
    }

    const currencyId = queryParams.get("currencyId");
    if (queryParams.get("action") === "get-funds" && currencyId) {
      startStakeFlow({
        shouldRedirect: false,
        currencies: [currencyId],
        alwaysShowNoFunds: true,
      });
    }

    // reset the query params so we don't trigger the effect again
    history.replace({
      search: "",
    });
  }, [history, location.search, startStakeFlow]);
};
