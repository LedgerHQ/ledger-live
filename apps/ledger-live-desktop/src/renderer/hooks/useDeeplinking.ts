import { ipcRenderer } from "electron";
import { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useHistory } from "react-router-dom";
import {
  findCryptoCurrencyByKeyword,
  parseCurrencyUnit,
} from "@ledgerhq/live-common/currencies/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { openModal, closeAllModal } from "~/renderer/actions/modals";
import { deepLinkUrlSelector, areSettingsLoaded } from "~/renderer/reducers/settings";
import { setDeepLinkUrl } from "~/renderer/actions/settings";
import { setTrackingSource } from "../analytics/TrackPage";

const getAccountsOrSubAccountsByCurrency = (currency, accounts) => {
  const predicateFn = account => getAccountCurrency(account).id === currency.id;
  if (currency.type === "TokenCurrency") {
    const tokenAccounts = accounts
      .filter(acc => acc.subAccounts && acc.subAccounts.length > 0)
      .map(acc => {
        // why you do this Flow
        const found = acc.subAccounts.find(predicateFn);
        return found || null;
      })
      .filter(Boolean);
    return tokenAccounts;
  }
  return accounts.filter(predicateFn);
};
export function useDeepLinkHandler() {
  const dispatch = useDispatch();
  const accounts = useSelector(accountsSelector);
  const location = useLocation();
  const history = useHistory();
  const navigate = useCallback(
    (pathname: string, state?: any, search?: string) => {
      const hasNewPathname = pathname !== location.pathname;
      const hasNewSearch = typeof search === "string" && search !== location.search;
      if (hasNewPathname || hasNewSearch) {
        setTrackingSource("deeplink");
        history.push({
          pathname,
          state,
          search,
        });
      }
    },
    [history, location],
  );
  const handler = useCallback(
    (event: any, deeplink: string) => {
      const { pathname, searchParams, search } = new URL(deeplink);
      /**
       * TODO: handle duplicated query params
       * Today, it only keeps one (the last) key / value pair encountered in search params
       * There is a loss of information
       * Example: http://localhost:5000/?weiAmount=0&foo=bar&abc=xyz&abc=123&theme=test
       * will result in a "query" object with the following structure:
       * {
       *  "weiAmount": "0",
       *  "foo": "bar",
       *  "abc": "123",
       *  "theme": "test"
       * }
       * instead of the following structure:
       * {
       *  "weiAmount": "0",
       *  "foo": "bar",
       *  "abc": ['xyz', '123'],
       *  "theme": "test"
       * }
       *
       * We could probably use https://github.com/ljharb/qs instead of URL and
       * Object.fromEntries(searchParams) because we would have to use
       * searchParams.getAll("abc") to get the array from the searchParams with
       * what we have now
       */
      const query = Object.fromEntries(searchParams);
      const fullUrl = pathname.replace(/(^\/+|\/+$)/g, "");
      const [url, path] = fullUrl.split("/");
      switch (url) {
        case "accounts":
          navigate("/accounts");
          break;
        case "buy":
          navigate("/exchange");
          break;
        case "earn": {
          navigate("/earn", undefined, search);
          break;
        }
        case "myledger": {
          const { installApp } = query;
          if (!installApp || typeof installApp !== "string") {
            navigate("/manager");
          } else {
            navigate("/manager", undefined, `?q=${installApp}`);
          }
          break;
        }
        case "swap":
          navigate("/swap");
          break;
        case "account": {
          const { currency } = query;
          if (!currency || typeof currency !== "string") return;
          const c = findCryptoCurrencyByKeyword(currency.toUpperCase());
          if (!c || c.type === "FiatCurrency") return;
          const found = getAccountsOrSubAccountsByCurrency(c, accounts || []);
          if (!found.length) return;
          const [chosen] = found;
          if (chosen.type === "Account") {
            navigate(`/account/${chosen.id}`);
          } else {
            navigate(`/account/${chosen.parentId}/${chosen.id}`);
          }
          break;
        }
        case "bridge": {
          const { origin, appName } = query;
          dispatch(closeAllModal());
          dispatch(
            openModal("MODAL_WEBSOCKET_BRIDGE", {
              origin,
              appName,
            }),
          );
          break;
        }
        case "delegate":
        case "receive":
        case "send": {
          const modal =
            url === "send" ? "MODAL_SEND" : url === "receive" ? "MODAL_RECEIVE" : "MODAL_DELEGATE";
          const { currency, recipient, amount } = query;
          if (!currency || typeof currency !== "string") return;
          if (url === "delegate" && currency !== "tezos") return;
          const c = findCryptoCurrencyByKeyword(currency.toUpperCase());
          if (!c || c.type === "FiatCurrency") {
            dispatch(
              openModal(modal, {
                recipient,
              }),
            );
            return;
          }
          const found = getAccountsOrSubAccountsByCurrency(c, accounts || []);
          if (!found.length) {
            dispatch(
              openModal(modal, {
                recipient,
                amount:
                  amount && typeof amount === "string"
                    ? parseCurrencyUnit(c.units[0], amount)
                    : undefined,
              }),
            );
            return;
          }
          const [chosen] = found;
          dispatch(closeAllModal());
          if (chosen.type === "Account") {
            dispatch(
              openModal(modal, {
                account: chosen,
                recipient,
                amount:
                  amount && typeof amount === "string"
                    ? parseCurrencyUnit(c.units[0], amount)
                    : undefined,
              }),
            );
          } else {
            dispatch(
              openModal(modal, {
                account: chosen,
                parentAccount: accounts.find(acc => acc.id === chosen.parentId),
                recipient,
                amount:
                  amount && typeof amount === "string"
                    ? parseCurrencyUnit(c.units[0], amount)
                    : undefined,
              }),
            );
          }
          break;
        }
        case "settings": {
          switch (path) {
            case "general":
              navigate("/settings/display");
              break;
            case "accounts":
            case "about":
            case "help":
            case "experimental":
              navigate(`/settings/${path}`);
              break;
            default:
              navigate("/settings");
              break;
          }
          break;
        }
        case "discover":
          navigate(`/platform/${path ?? ""}`, query);
          break;
        case "wc": {
          setTrackingSource("deeplink");
          navigate("/platform/ledger-wallet-connect", query);

          break;
        }
        case "market":
          navigate(`/market`);
          break;
        case "portfolio":
        default:
          navigate("/");
          break;
      }
    },
    [accounts, dispatch, navigate],
  );
  return {
    handler,
  };
}
function useDeeplink() {
  const dispatch = useDispatch();
  const openingDeepLink = useSelector(deepLinkUrlSelector);
  const loaded = useSelector(areSettingsLoaded);
  const { handler } = useDeepLinkHandler();
  useEffect(() => {
    // subscribe to deep-linking event
    ipcRenderer.on("deep-linking", handler);
    return () => ipcRenderer.removeListener("deep-linking", handler);
  }, [handler]);
  useEffect(() => {
    if (openingDeepLink && loaded) {
      handler(null, openingDeepLink);
      dispatch(setDeepLinkUrl(null));
    }
  }, [loaded, openingDeepLink, dispatch, handler]);
}
export default useDeeplink;
