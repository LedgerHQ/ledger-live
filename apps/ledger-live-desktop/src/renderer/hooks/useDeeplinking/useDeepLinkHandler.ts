import { useCallback } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";

import { useLocation, useHistory } from "react-router-dom";
import {
  findCryptoCurrencyByKeyword,
  parseCurrencyUnit,
} from "@ledgerhq/live-common/currencies/index";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { openModal, closeAllModal } from "~/renderer/reducers/modals";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { useNavigateToPostOnboardingHubCallback } from "~/renderer/components/PostOnboardingHub/logic/useNavigateToPostOnboardingHubCallback";
import { usePostOnboardingDeeplinkHandler } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { setDrawerVisibility as setLedgerSyncDrawerVisibility } from "~/renderer/actions/walletSync";
import { CARD_APP_ID, WC_ID } from "@ledgerhq/live-common/wallet-api/constants";
import { getAccountsOrSubAccountsByCurrency, trackDeeplinkingEvent } from "./utils";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { useRedirectToPostOnboardingCallback } from "../useAutoRedirectToPostOnboarding";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";

export function useDeepLinkHandler() {
  const dispatch = useDispatch();
  const accounts = useSelector(accountsSelector);
  const location = useLocation();
  const history = useHistory();
  const navigateToHome = useCallback(() => history.push("/"), [history]);
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();
  const postOnboardingDeeplinkHandler = usePostOnboardingDeeplinkHandler(
    navigateToHome,
    navigateToPostOnboardingHub,
  );
  const tryRedirectToPostOnboardingOrRecover = useRedirectToPostOnboardingCallback();

  const { openAddAccountFlow, openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    "deeplink",
  );
  const openSendFlow = useOpenSendFlow();

  const navigate = useCallback(
    (
      pathname: string,
      state?: {
        [k: string]: string | object;
      },
      search?: string,
    ) => {
      const hasNewPathname = pathname !== location.pathname;
      const hasNewSearch = typeof search === "string" && search !== location.search;
      const hasNewState = JSON.stringify(state) !== JSON.stringify(location.state);
      if (hasNewPathname || hasNewSearch) {
        setTrackingSource("deeplink");
        history.push({
          pathname,
          state,
          search,
        });
      } else if (!hasNewPathname && hasNewState) {
        setTrackingSource("deeplink");
        history.replace({
          pathname,
          state,
          search,
        });
      }
    },
    [history, location],
  );

  const handler = useCallback(
    (_: unknown, deeplink: string) => {
      const urlObj = new URL(deeplink);
      const { pathname, searchParams, search } = urlObj;
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

      // With new Chrome behavior: host contains the main URL part, pathname contains the path
      // ledgerwallet://settings/about -> host: "settings", pathname: "/about"
      const url = urlObj.host;
      const path = pathname.replace(/(^\/+|\/+$)/g, "");

      const {
        ajs_prop_source: ajsPropSource,
        ajs_prop_campaign: ajsPropCampaign,
        ajs_prop_track_data: ajsPropTrackData,
        currency,
        installApp,
        appName,
        deeplinkSource,
        deeplinkType,
        deeplinkDestination,
        deeplinkChannel,
        deeplinkMedium,
        deeplinkCampaign,
        deeplinkLocation,
      } = query;

      trackDeeplinkingEvent({
        ajsPropSource,
        ajsPropCampaign,
        ajsPropTrackData,
        currency,
        installApp,
        appName,
        deeplinkSource,
        deeplinkType,
        deeplinkDestination,
        deeplinkChannel,
        deeplinkMedium,
        deeplinkCampaign,
        deeplinkLocation,
        url,
      });

      switch (url) {
        case "accounts": {
          const { address } = query;
          if (address && typeof address === "string") {
            const account = accounts.find(acc => acc.freshAddress === address);
            if (account) {
              navigate(`/account/${account.id}`);
              break;
            }
          }
          navigate("/accounts");
          break;
        }
        case "account": {
          const { address, currency } = query;

          if (!currency || typeof currency !== "string") return;
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const c = findCryptoCurrencyByKeyword(currency.toUpperCase()) as Currency;
          if (!c || c.type === "FiatCurrency") return;
          const foundAccounts = getAccountsOrSubAccountsByCurrency(c, accounts || []);
          if (!foundAccounts.length) return;

          // Navigate to a specific account if a valid 'address' is provided and the account currency matches the 'currency' param in the deeplink URL
          if (address && typeof address === "string") {
            const account = accounts.find(
              acc =>
                acc.freshAddress === address &&
                acc.currency.id.toLowerCase() === currency.toLowerCase(),
            );

            if (account) {
              navigate(`/account/${account.id}`);
            }
            break;
          }

          const [chosenAccount] = foundAccounts;

          if (chosenAccount?.type === "Account") {
            navigate(`/account/${chosenAccount.id}`);
          } else {
            navigate(`/account/${chosenAccount?.parentId}/${chosenAccount?.id}`);
          }
          break;
        }
        case "add-account": {
          const { currency } = query;

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const foundCurrency = findCryptoCurrencyByKeyword(
            typeof currency === "string" ? currency?.toUpperCase() : "",
          );

          if (foundCurrency) {
            openAddAccountFlow(foundCurrency, true);
          }

          break;
        }
        case "buy":
          navigate("/exchange", undefined, search);
          break;
        case "earn": {
          if (path === "deposit") {
            const { cryptoAssetId, accountId } = query;
            navigate(
              "/earn",
              {
                intent: "deposit",
                cryptoAssetId: cryptoAssetId ?? "",
                accountId: accountId ?? "",
              },
              search,
            );
          } else {
            navigate("/earn", undefined, search);
          }
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
        case "swap": {
          const { amountFrom, fromToken, toToken, affiliate } = query;

          const state: {
            defaultToken?: { fromTokenId: string; toTokenId: string };
            defaultAmountFrom?: string;
            affiliate?: string;
          } = {};

          if (fromToken !== toToken) {
            state.defaultToken = { fromTokenId: fromToken, toTokenId: toToken };
          }

          if (amountFrom) {
            state.defaultAmountFrom = amountFrom;
          }

          if (affiliate) {
            state.affiliate = affiliate;
          }

          navigate("/swap", state);

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
        case "receive":
        case "delegate":
        case "send": {
          const modalMap = {
            send: "MODAL_SEND",
            delegate: "MODAL_DELEGATE",
            receive: "MODAL_RECEIVE",
          } as const;
          const modal = modalMap[url];
          const { currency, recipient, amount } = query;
          const sendRecipient = typeof recipient === "string" ? recipient : undefined;
          const sendAmount = typeof amount === "string" ? amount : undefined;

          if (url === "delegate" && currency !== "tezos") return;

          /**
           * Handles deep link navigation for send, receive, and delegate flows.
           *
           *
           * @flow
           * 1. **No currency parameter**
           *    - Opens the modal without account pre-selection
           *    - User can select any available account
           *
           * 2. **Currency not found**
           *    - Redirects to Asset Flow to help user discover the asset
           *    - (Not applicable to delegate flow)
           *
           * 3. **Currency found, but user has no accounts**
           *    - Redirects to Add Account Flow
           *    - Callback provided to reopen modal after account creation
           *
           * 4. **Currency found with existing accounts**
           *    - Opens modal with first matching account pre-selected
           *    - For tokens: includes both token account and parent account
           *
           * @example Basic flows
           * ledgerwallet://send                    // Open send modal, no pre-selection
           * ledgerwallet://receive?currency=btc    // Receive Bitcoin
           * ledgerwallet://delegate?currency=tezos // Delegate Tezos
           *
           * @example Send with pre-filled data
           * ledgerwallet://send?currency=ethereum&recipient=0x581A5bbcE3AED0B928B3F48842BaDA3F9C360d97&amount=0.0001
           *
           */
          async function handleDeepLink() {
            dispatch(closeAllModal());
            setDrawer();
            if (!currency) {
              if (url === "send") {
                openSendFlow({
                  recipient: sendRecipient,
                  amount: sendAmount,
                });
              } else {
                dispatch(
                  openModal(modal, {
                    ...(url === "receive" ? { shouldUseReceiveOptions: false } : {}),
                  }),
                );
              }
              return;
            }

            let foundCurrency;
            try {
              const currencyId = typeof currency === "string" ? currency : "";
              foundCurrency =
                findCryptoCurrencyByKeyword(currencyId) ||
                (await getCryptoAssetsStore().findTokenById(currencyId)) ||
                null;
            } catch {
              foundCurrency = null;
            }

            const openModalWithAccount = (
              account: Account | TokenAccount,
              parentAccount?: Account,
            ) => {
              if (url === "send") {
                openSendFlow({
                  account,
                  parentAccount,
                  recipient: sendRecipient,
                  amount: sendAmount,
                });
                return;
              }
              dispatch(
                openModal(modal, {
                  ...(url === "receive" ? { shouldUseReceiveOptions: false } : {}),
                  recipient,
                  account,
                  parentAccount,
                  amount:
                    amount && typeof amount === "string" && foundCurrency
                      ? parseCurrencyUnit(foundCurrency.units[0], amount)
                      : undefined,
                }),
              );
            };

            if (!foundCurrency) {
              openAssetFlow();
              return;
            }

            const matchingAccounts = getAccountsOrSubAccountsByCurrency(
              foundCurrency,
              accounts || [],
            );

            if (!matchingAccounts.length) {
              openAddAccountFlow(foundCurrency, true, openModalWithAccount);
              return;
            }

            const [selectedAccount] = matchingAccounts;

            if (selectedAccount?.type === "Account") {
              openModalWithAccount(selectedAccount);
            } else {
              const parentAccount = accounts.find(acc => acc.id === selectedAccount?.parentId);
              if (parentAccount && selectedAccount) {
                openModalWithAccount(selectedAccount, parentAccount);
              }
            }
          }

          handleDeepLink();
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
        case "card":
          navigate("/card", query);
          break;
        case "discover":
          if (path?.startsWith("protect")) {
            navigate(`/recover/${path}`, undefined, search);
          } else if (path === CARD_APP_ID) {
            navigate("/card", query);
          } else {
            navigate(`/platform/${path ?? ""}`, query);
          }
          break;
        case "wc": {
          const wcPathname = `/platform/${WC_ID}`;
          // Only prevent requests if already on the wallet connect live-app
          if (location.pathname === wcPathname) {
            try {
              // Prevent a request from updating the live-app url and reloading it
              if (!query.uri || new URL(query.uri).searchParams.get("requestId")) {
                return;
              }
            } catch {
              // Fall back on navigation to the live-app in case of an invalid URL
            }
          }
          setTrackingSource("deeplink");
          navigate(wcPathname, query);

          break;
        }
        case "market":
          if (path) {
            navigate(`/market/${path}`);
          } else {
            navigate(`/market`);
          }
          break;
        case "asset":
          if (path) {
            navigate(`/asset/${path}`);
          }
          break;
        case "recover":
          navigate(`/recover/${path}`, undefined, search);
          break;
        case "recover-restore-flow":
          navigate("/recover-restore");
          break;
        case "post-onboarding": {
          postOnboardingDeeplinkHandler(query.device);
          break;
        }
        case "ledgersync": {
          navigate("/settings/display");
          dispatch(setLedgerSyncDrawerVisibility(true));
          break;
        }
        default:
          if (!tryRedirectToPostOnboardingOrRecover()) {
            navigate("/");
          }
          break;
      }
    },
    [
      accounts,
      dispatch,
      location.pathname,
      navigate,
      openAddAccountFlow,
      openAssetFlow,
      postOnboardingDeeplinkHandler,
      tryRedirectToPostOnboardingOrRecover,
      openSendFlow,
    ],
  );

  return {
    handler,
  };
}
