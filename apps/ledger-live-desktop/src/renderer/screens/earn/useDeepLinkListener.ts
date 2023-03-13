import useStakeFlow from "~/renderer/screens/stake";
import { useHistory, useLocation } from "react-router-dom";
import { useEffect } from "react";

type QueryParamAction =
  | {
      action: "stake";
    }
  | {
      action: "get-funds";
      currencyId: string;
    };

const isValidQueryParamAction = (params: any): params is QueryParamAction => {
  if (!params || typeof params !== "object") {
    return false;
  }
  return (
    params.action === "stake" ||
    (params.action === "get-funds" && typeof params.currencyId === "string")
  );
};

export const useDeepLinkListener = () => {
  const startStakeFlow = useStakeFlow();
  const location = useLocation();
  const history = useHistory();

  // looks for query params to trigger stake flow
  useEffect(() => {
    const rawQueryParams = new URLSearchParams(location.search);
    const queryParams = rawQueryParams.get("q");

    if (!queryParams) {
      return;
    }

    const decodedQueryParams = JSON.parse(decodeURIComponent(queryParams));
    if (!isValidQueryParamAction(decodedQueryParams)) {
      return;
    }

    if (decodedQueryParams.action === "stake") {
      startStakeFlow({ shouldRedirect: false });
    }

    if (decodedQueryParams.action === "get-funds") {
      startStakeFlow({
        shouldRedirect: false,
        currencies: [decodedQueryParams.currencyId],
        alwaysShowNoFunds: true,
      });
    }

    // reset the query params so we don't trigger the effect again
    history.replace({
      search: "",
    });
  }, [history, location.search, startStakeFlow]);
};
