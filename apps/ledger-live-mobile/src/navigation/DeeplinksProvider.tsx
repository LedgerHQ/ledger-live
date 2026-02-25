import React, { useMemo, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { Platform, Linking, View, StyleSheet } from "react-native";
import {
  getStateFromPath,
  LinkingOptions,
  NavigationContainer,
  NavigationState,
  PartialState,
} from "@react-navigation/native";
import Config from "react-native-config";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { BUY_SELL_UI_APP_ID } from "@ledgerhq/live-common/wallet-api/constants";
import Braze from "@braze/react-native-sdk";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import { navigationRef, isReadyRef } from "../rootnavigation";
import { ScreenName, NavigatorName } from "~/const";
import { setWallectConnectUri } from "~/actions/walletconnect";
import { useGeneralTermsAccepted } from "~/logic/terms";
import { lightTheme, darkTheme, Theme } from "../colors";
import { track } from "~/analytics";
import {
  makeSetEarnInfoModalAction,
  makeSetEarnMenuModalAction,
  makeSetEarnProtocolInfoModalAction,
} from "~/actions/earn";
import { blockPasswordLock } from "../actions/appstate";
import { handleModularDrawerDeeplink } from "LLM/features/ModularDrawer";
import { logLastStartupEvents } from "LLM/utils/logLastStartupEvents";
import { logStartupEvent } from "LLM/utils/logStartupTime";
import { STARTUP_EVENTS } from "LLM/utils/resolveStartupEvents";

const TRACKING_EVENT = "deeplink_clicked";
import {
  validateEarnAction,
  validateEarnInfoModal,
  validateEarnMenuModal,
  logSecurityEvent,
  EarnDeeplinkAction,
  validateEarnDepositScreen,
  validateLargeMoverCurrencyIds,
  validateMarketCurrencyId,
} from "./deeplinks/validation";
import { AppLoadingManager } from "LLM/features/LaunchScreen";
import { SplashScreenHandle } from "LLM/features/LaunchScreen/SplashScreenHandle";
import { useDeeplinkDrawerCleanup } from "./deeplinks/useDeeplinkDrawerCleanup";

const themes: {
  [key: string]: Theme;
} = {
  light: lightTheme,
  dark: darkTheme,
};

const SPLASH_SCREEN_BACKGROUND_COLOR = "#18171A";
const styles = StyleSheet.create({
  appBackground: {
    flex: 1,
    backgroundColor: SPLASH_SCREEN_BACKGROUND_COLOR,
  },
});

function handleStartComplete() {
  logLastStartupEvents(STARTUP_EVENTS.NAV_READY);
}

function isWalletConnectUrl(url: string) {
  return url.startsWith("wc:");
}

function isWalletConnectLink(url: string) {
  return (
    isWalletConnectUrl(url) ||
    url.startsWith("ledgerwallet://wc") ||
    url.startsWith("ledgerlive://wc") ||
    url.startsWith("https://ledger.com/wc")
  );
}

function getProxyURL(url: string, customBuySellUiAppId?: string) {
  const uri = new URL(url);
  const { hostname, pathname } = uri;
  const platform = pathname.split("/")[1];

  if (hostname === "discover" && platform && platform.startsWith("protect")) {
    return url.replace("://discover", "://recover");
  }

  if (isWalletConnectUrl(url)) {
    return `ledgerlive://wc?uri=${encodeURIComponent(url)}`;
  }

  const buySellAppIds = customBuySellUiAppId
    ? [customBuySellUiAppId, BUY_SELL_UI_APP_ID]
    : [BUY_SELL_UI_APP_ID];

  // This is to handle links set in the useFromAmountStatusMessage in LLC.
  // Also handles a difference in paths between LLD on LLD /platform/:app_id
  // but on LLM /discover/:app_id
  if (hostname === "platform" && buySellAppIds.includes(platform)) {
    return url.replace("://platform", "://discover");
  }

  return url;
}

// DeepLinking
const linkingOptions = () => ({
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (url) {
      return url ? getProxyURL(url) : null;
    }
    const brazeUrl: string | null = await new Promise(resolve => {
      Braze.getInitialPushPayload(payload => resolve(payload?.url ?? null));
    });
    return brazeUrl ? getProxyURL(brazeUrl) : null;
  },

  prefixes: [
    "ledgerwallet://",
    "ledgerlive://",
    "https://ledger.com",
    // FIXME: We will be fixing the universal links in this epic : https://ledgerhq.atlassian.net/browse/LIVE-14732
    /**
     * Adjust universal links attached to iOS Bundle ID com.ledger.live
     * (local debug, prod & nightly builds)
     * (https://r354.adj.st/.well-known/apple-app-site-association)
     * (https://ledger.go.link/.well-known/apple-app-site-association)
     *
     * to use these universal links, add this query parameter to the URL: adj_t=r1guxhk
     *  */
    "https://r354.adj.st",
    "https://ledger.go.link",
    /**
     * Adjust universal links attached to iOS Bundle ID com.ledger.live.debug
     * (https://a4wc.adj.st/.well-known/apple-app-site-association)
     * (https://ledger-debug.go.link/.well-known/apple-app-site-association)
     *
     * to use these universal links, add this query parameter to the URL: adj_t=f1vrzvp
     *  */
    "https://a4wc.adj.st",
    "https://ledger-debug.go.link",
    /**
     * Adjust universal links attached to iOS Bundle ID com.ledger.live.dev
     * (staging builds)
     * (https://fvsc.adj.st/.well-known/apple-app-site-association)
     * (https://ledger-staging.go.link/.well-known/apple-app-site-association)
     *
     * to use these universal links, add this query parameter to the URL: adj_t=p72sbdr
     *  */
    "https://fvsc.adj.st",
    "https://ledger-staging.go.link",
  ],
  config: {
    screens: {
      [NavigatorName.Base]: {
        initialRouteName: NavigatorName.Main,
        screens: {
          [NavigatorName.WalletConnect]: {
            screens: {
              /**
               * @params ?uri: string
               * ie: "ledgerlive://wc?uri=wc:00e46b69-d0cc-4b3e-b6a2-cee442f97188@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=91303dedf64285cbbaf9120f6e9d160a5c8aa3deb67017a3874cd272323f48ae
               */
              [ScreenName.WalletConnectConnect]: "wc",
            },
          },

          [ScreenName.PostBuyDeviceScreen]: "hw-purchase-success",

          [ScreenName.BleDevicePairingFlow]: "sync-onboarding",

          [ScreenName.RedirectToOnboardingRecoverFlow]: "recover-restore-flow",

          /**
           * @params ?platform: string
           * ie: "ledgerlive://discover/paraswap?theme=light" will open the catalog and the paraswap dapp with a light theme as parameter
           */
          [ScreenName.PlatformApp]: "discover/:platform",
          [NavigatorName.Card]: {
            initialRouteName: ScreenName.Card,
            screens: {
              [ScreenName.Card]: "card",
            },
          },
          [ScreenName.Recover]: "recover/:platform",
          /**
           * ie: "ledgerlive://market/:currencyId" will open the market detail page for the given currency
           */
          [ScreenName.MarketDetail]: "market/:currencyId",
          [NavigatorName.PostOnboarding]: {
            screens: {
              /**
               * ie: "ledgerlive://post-onboarding" will open the home page as the device parameter is not provided
               *
               * @params ?device: string
               * ie: "ledgerlive://post-onboarding?device=stax" will open post-onboarding for the stax device (it should be a device model id)
               *
               */
              [ScreenName.PostOnboardingDeeplinkHandler]: "post-onboarding",
            },
          },
          /**
           * ie: "ledgerlive://swap" -> will redirect to the main swap page
           * @params ?affiliate: string, ?fromToken: string, ?toToken: string, ?amountFrom: string, ?amountTo: string
           * ie: "ledgerlive://swap?refererId=lol&fromToken=bitcoin&toToken=ethereum&amountFrom=100&affiliate=partner123"
           */
          [NavigatorName.Swap]: {
            screens: {
              [ScreenName.SwapTab]: "swap",
            },
          },

          [NavigatorName.SendFunds]: {
            screens: {
              /**
               * @params ?currency: string
               * ie: "ledgerlive://send?currency=bitcoin" will open the prefilled search account in the send flow
               */
              [ScreenName.SendCoin]: "send",
            },
          },
          /**
           * ie: "ledgerlive://buy" -> will redirect to the main exchange page
           */
          [NavigatorName.Exchange]: {
            initialRouteName: "buy",
            screens: {
              [ScreenName.ExchangeBuy]: "buy/:currency?",
              [ScreenName.ExchangeSell]: "sell/:currency?",
            },
          },

          [NavigatorName.Settings]: {
            initialRouteName: ScreenName.SettingsScreen,
            screens: {
              /**
               * ie: "ledgerlive://settings/experimental" -> will redirect to the experimental settings panel
               */
              [ScreenName.SettingsScreen]: "settings",
              [ScreenName.GeneralSettings]: "settings/general",
              [ScreenName.AccountsSettings]: "settings/accounts",
              [ScreenName.AboutSettings]: "settings/about",
              [ScreenName.HelpSettings]: "settings/help",
              [ScreenName.ExperimentalSettings]: "settings/experimental",
              [ScreenName.DeveloperSettings]: "settings/developer",
              [ScreenName.NotificationsSettings]: "settings/notifications",
            },
          },

          [NavigatorName.CustomImage]: {
            screens: {
              /**
               * ie: "ledgerlive://custom-image"
               */
              [ScreenName.CustomImageStep0Welcome]: "custom-image",
            },
          },
          [NavigatorName.LandingPages]: {
            screens: {
              /**
               * @params ?useCase: LandingPageUseCase
               * ie: "ledgerlive://landing-page?useCase=LP_Generic" will open the landing page screen with the use case LP_Generic
               *
               */
              [ScreenName.GenericLandingPage]: "landing-page",
              [ScreenName.LargeMoverLandingPage]: "landing-page-large-mover",
            },
          },

          [NavigatorName.WalletSync]: {
            screens: {
              [ScreenName.LedgerSyncDeepLinkHandler]: "ledgersync",
            },
          },
        },
      },
    },
  },
});

const getOnboardingLinkingOptions = (acceptedTermsOfUse: boolean) => ({
  ...linkingOptions(),
  config: {
    initialRouteName: NavigatorName.BaseOnboarding,
    screens: !acceptedTermsOfUse
      ? {}
      : {
          [NavigatorName.BaseOnboarding]: {
            screens: {
              [NavigatorName.Onboarding]: {
                initialRouteName: ScreenName.OnboardingWelcome,
                screens: {
                  [ScreenName.OnboardingBleDevicePairingFlow]: "sync-onboarding",
                },
              },
            },
          },
          [NavigatorName.Base]: {
            screens: {
              [ScreenName.PostBuyDeviceScreen]: "hw-purchase-success",
              /**
               * @params ?platform: string
               * ie: "ledgerlive://discover/protect?theme=light" will open the catalog and the protect dapp with a light theme as parameter
               */
              [ScreenName.PlatformApp]: "discover/:platform",
              [ScreenName.Recover]: "recover/:platform",
              [ScreenName.RedirectToOnboardingRecoverFlow]: "recover-restore-flow",
            },
          },
        },
  },
});

const emptyObject: LiveAppManifest[] = [];

function isScreenInState(
  screenName: string,
  state?: NavigationState | PartialState<NavigationState>,
) {
  if (!state) {
    return false;
  }
  for (let i = 0; i < state.routes.length; i++) {
    if (state.routes[i].name === screenName) {
      return true;
    }
    if (state.routes[i].state && isScreenInState(screenName, state.routes[i].state)) {
      return true;
    }
  }
  return false;
}

export const DeeplinksProvider = ({
  children,
  resolvedTheme,
}: {
  children: React.ReactNode;
  resolvedTheme: "light" | "dark";
}) => {
  logStartupEvent("DeeplinksProvider render");

  const dispatch = useDispatch();
  const triggeredAppStartRef = useRef(true);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  // Hook to close drawers when deeplink is triggered after app was in background
  const onDeeplinkReceived = useDeeplinkDrawerCleanup();

  const { state } = useRemoteLiveAppContext();
  const liveAppProviderInitialized = !!state.value || !!state.error;
  const manifests = state?.value?.liveAppByIndex || emptyObject;
  // Can be either true, false or null, meaning we don't know yet
  const userAcceptedTerms = useGeneralTermsAccepted();
  const buySellUiFlag = useFeature("buySellUi");
  const llmAccountListUI = useFeature("llmAccountListUI");
  const { shouldDisplayMarketBanner } = useWalletFeaturesConfig("mobile");

  const buySellUiManifestId = buySellUiFlag?.params?.manifestId;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const theme = themes[resolvedTheme] as ReactNavigation.Theme;
  const AccountsListScreenName = llmAccountListUI?.enabled
    ? ScreenName.AccountsList
    : ScreenName.Accounts;

  const linking = useMemo<LinkingOptions<ReactNavigation.RootParamList>>(() => {
    return (
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      {
        ...(hasCompletedOnboarding
          ? {
              ...linkingOptions(),
              config: {
                ...linkingOptions().config,
                screens: {
                  ...linkingOptions().config.screens,
                  [NavigatorName.Base]: {
                    ...linkingOptions().config.screens[NavigatorName.Base],
                    screens: {
                      ...linkingOptions().config.screens[NavigatorName.Base].screens,

                      /** "ledgerlive://assets will open assets screen. */
                      ...(llmAccountListUI?.enabled && {
                        [NavigatorName.Assets]: {
                          screens: {
                            /**
                             * @params ?showHeader: boolean
                             * @params ?isSyncEnabled: boolean
                             * @params ?sourceScreenName: string
                             * ie: "ledgerlive://assets?showHeader=true will open assets screen with header
                             * ie "ledgerlive://assets?isSyncEnabled=true will open assets screen with sync enabled
                             * ie "ledgerlive://assets?sourceScreenName=Portfolio will open assets screen with source screen name Portfolio for tracking inside the screen
                             */
                            [ScreenName.AssetsList]: "assets",
                          },
                        },
                      }),
                      [NavigatorName.Main]: {
                        initialRouteName: ScreenName.Portfolio,
                        screens: {
                          /**
                           * ie: "ledgerlive://portfolio" -> will redirect to the portfolio
                           */

                          [NavigatorName.Portfolio]: {
                            screens: {
                              ...(!llmAccountListUI?.enabled && {
                                [NavigatorName.PortfolioAccounts]: {
                                  screens: {
                                    /**
                                     * "ledgerlive://accounts" opens the main portfolio screen of accounts.
                                     */
                                    [ScreenName.Accounts]: "accounts",
                                  },
                                },
                              }),
                              [NavigatorName.WalletTab]: {
                                screens: {
                                  [ScreenName.Portfolio]: "portfolio",
                                  [NavigatorName.Market]: {
                                    screens: {
                                      /**
                                       * ie: "ledgerlive://market" will open the market screen
                                       */
                                      [ScreenName.MarketList]: "market",
                                    },
                                  },
                                },
                              },
                            },
                          },
                          [NavigatorName.Earn]: {
                            screens: {
                              /**
                               * ie: "ledgerlive://earn" will open earn dashboard page
                               *
                               * @params ?action: string
                               * ie: "ledgerlive://earn?action=stake" will open staking flow
                               *
                               * * @params ?action: string
                               * * @params &accountId: string
                               * ie: "ledgerlive://earn?action=stake-account&accountId=XXXX" will open staking flow with specific account
                               *
                               * * @params ?action: string
                               * * @params ?currencyId: string
                               * ie: "ledgerlive://earn?action=get-funds&currencyId=ethereum" will open buy drawer with currency
                               *
                               */
                              [ScreenName.Earn]: "earn",
                            },
                          },
                          [NavigatorName.Discover]: {
                            screens: {
                              /**
                               * ie: "ledgerlive://discover" will open the catalog
                               */
                              [ScreenName.PlatformCatalog]: "discover",
                            },
                          },
                          [NavigatorName.MyLedger]: {
                            screens: {
                              /**
                               * ie: "ledgerlive://myledger" will open MyLedger page
                               *
                               * @params ?installApp: string
                               * ie: "ledgerlive://myledger?installApp=bitcoin" will open myledger with "bitcoin" prefilled in the search input
                               *
                               * * @params ?searchQuery: string
                               * ie: "ledgerlive://myledger?searchQuery=bitcoin" will open myledger with "bitcoin" prefilled in the search input
                               */
                              [ScreenName.MyLedgerChooseDevice]: "myledger",
                            },
                          },
                        },
                      },
                      [NavigatorName.Accounts]: {
                        screens: {
                          /**
                           * "ledgerlive://accounts" opens the main portfolio screen of accounts.
                           */
                          /**
                           * if llmAccountListUI is enabled
                           * @params ?showHeader: boolean
                           * @params ?canAddAccount: boolean
                           * @params ?isSyncEnabled: boolean
                           * @params ?sourceScreenName: string
                           * ie: "ledgerlive://accounts?showHeader=true will open accounts screen with header
                           * ie "ledgerlive://accounts?canAddAccount=true will open accounts screen with add account button
                           * ie "ledgerlive://accounts?isSyncEnabled=true will open accounts screen with sync enabled
                           * ie "ledgerlive://accounts?sourceScreenName=Portfolio will open accounts screen with source screen name Portfolio for tracking inside the screen
                           */
                          [AccountsListScreenName]: "accounts",
                          /**
                           * @params ?currency: string
                           * @params ?address: string
                           * ie: "ledgerlive://account?currency=ethereum&address={{eth_account_address}} will open that account's assets screen.
                           * Currency param alone e.g. "ledgerlive://account?currency=tezos" will open the Tezos Assets screen.
                           */
                          [ScreenName.Accounts]: "account",
                          /**
                           * @params currencyId: string (path parameter)
                           * ie: "ledgerlive://asset/bitcoin" will open the Bitcoin Asset screen.
                           */
                          [ScreenName.Asset]: "asset/:currencyId",
                        },
                      },
                    },
                  },
                },
              },
            }
          : getOnboardingLinkingOptions(!!userAcceptedTerms)),
        subscribe(listener) {
          const sub = Linking.addEventListener("url", ({ url }) => {
            // Track deeplink session when app comes from background
            track("Start", { isDeeplinkSession: true });
            triggeredAppStartRef.current = false;

            // Close all drawers if app was in background before deeplink
            onDeeplinkReceived();

            // Prevent default deep link if we're already in a wallet connect route.
            const navigationState = navigationRef.current?.getState();
            if (
              isWalletConnectLink(url) &&
              isScreenInState(ScreenName.WalletConnectConnect, navigationState)
            ) {
              const uri = isWalletConnectUrl(url) ? url : new URL(url).searchParams.get("uri");
              // Only update for a connection not a request
              if (uri && uri !== "wc:" && !new URL(uri).searchParams.get("requestId")) {
                // TODO use wallet-api to push event instead of reloading the webview
                dispatch(setWallectConnectUri(uri));
              }
              return;
            }

            listener(getProxyURL(url, buySellUiManifestId));
          });
          // Clean up the event listeners
          return () => {
            sub.remove();
          };
        },
        getStateFromPath: (path, config) => {
          const url = new URL(`ledgerwallet://${path}`);
          const { hostname, searchParams, pathname } = url;
          const query = Object.fromEntries(searchParams);
          const {
            ajs_prop_campaign: ajsPropCampaign,
            ajs_prop_track_data: ajsPropTrackData,
            ajs_prop_source: ajsPropSource,
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

          if (!ajsPropSource && !Config.MOCK) {
            /** Internal deep links cause the app to "background" on Android.
             * If "password lock" is enabled then this opens a re-authentication modal every time the user navigates by deep link.
             * If there is no ajsPropSource then assume deep link is from an internal app, so temporarily prevent password lock:
             */
            dispatch(blockPasswordLock(true)); // TODO: Remove this and the timeout after AuthPass refactor
            setTimeout(() => {
              dispatch(blockPasswordLock(false));
            }, 4000); // Allow 4 seconds before resetting password lock, unless on Detox e2e test, as this breaks CI.
          }

          const triggeredAppStart = triggeredAppStartRef.current;
          triggeredAppStartRef.current = false;

          // Track deeplink only when ajsPropSource attribute exists.
          if (ajsPropSource) {
            track(TRACKING_EVENT, {
              triggeredAppStart,
              deeplinkSource: ajsPropSource,
              deeplinkCampaign: ajsPropCampaign,
              url: hostname,
              currency,
              installApp,
              appName,
              deeplinkLocation,
              ...(ajsPropTrackData ? JSON.parse(ajsPropTrackData) : {}),
            });
          } else
            track(TRACKING_EVENT, {
              triggeredAppStart,
              deeplinkSource,
              deeplinkType,
              deeplinkDestination,
              deeplinkChannel,
              deeplinkMedium,
              deeplinkCampaign,
              deeplinkLocation,
            });

          const platform = pathname.split("/")[1];

          if (hostname === "landing-page-large-mover") {
            const currencyIds = searchParams.get("currencyIds");

            const validatedCurrencyIds = validateLargeMoverCurrencyIds(currencyIds);
            if (!validatedCurrencyIds) {
              // Redirect to market list when currencyIds is missing or invalid
              return;
            }
            url.searchParams.set("currencyIds", validatedCurrencyIds);
            return getStateFromPath(url.href?.split("://")[1], config);
          }

          if (hostname === "market") {
            const currencyIdFromPath = pathname.replace("/", "");
            if (currencyIdFromPath) {
              const validatedCurrencyId = validateMarketCurrencyId(currencyIdFromPath);

              if (!validatedCurrencyId) {
                return getStateFromPath("market", config);
              }

              url.pathname = `/${validatedCurrencyId}`;
              return getStateFromPath(url.href?.split("://")[1], config);
            }
            if (shouldDisplayMarketBanner) {
              return {
                routes: [
                  {
                    name: NavigatorName.Base,
                    state: {
                      routes: [{ name: ScreenName.MarketList }],
                    },
                  },
                ],
              };
            }
            return getStateFromPath("market", config);
          }

          // Handle asset deeplink - validate currencyId before navigation
          if (hostname === "asset") {
            const currencyIdFromPath = pathname.replace("/", "");
            if (currencyIdFromPath) {
              const validatedCurrencyId = validateMarketCurrencyId(currencyIdFromPath);

              if (!validatedCurrencyId) {
                return getStateFromPath("portfolio", config);
              }

              url.pathname = `/${validatedCurrencyId}`;
              return getStateFromPath(url.href?.split("://")[1], config);
            }
          }

          // Handle modular drawer deeplinks (receive & add-account)
          if (hostname === "receive" || hostname === "add-account") {
            return handleModularDrawerDeeplink(hostname, searchParams, dispatch, config);
          }

          if (hostname === "earn") {
            const earnParamAction = searchParams.get("action");
            const validatedAction = validateEarnAction(earnParamAction);

            if (!validatedAction && earnParamAction) {
              logSecurityEvent("blocked_action", {
                hostname,
                action: earnParamAction,
                reason: "Invalid action type",
              });
              return;
            }

            switch (validatedAction) {
              case EarnDeeplinkAction.INFO_MODAL: {
                const validatedModal = validateEarnInfoModal(
                  searchParams.get("message"),
                  searchParams.get("messageTitle"),
                  searchParams.get("learnMoreLink"),
                );

                if (!validatedModal) {
                  logSecurityEvent("validation_failed", {
                    hostname,
                    action: validatedAction,
                    reason: "Invalid info modal parameters",
                  });
                  return;
                }

                dispatch(makeSetEarnInfoModalAction(validatedModal));
                return;
              }
              case EarnDeeplinkAction.MENU_MODAL: {
                const validatedModal = validateEarnMenuModal(
                  searchParams.get("title"),
                  searchParams.get("options"),
                );

                if (!validatedModal) {
                  logSecurityEvent("validation_failed", {
                    hostname,
                    action: validatedAction,
                    reason: "Invalid menu modal parameters",
                  });
                  return;
                }

                dispatch(
                  makeSetEarnMenuModalAction({
                    title: validatedModal.title,
                    options: validatedModal.options,
                  }),
                );
                return;
              }
              case EarnDeeplinkAction.PROTOCOL_INFO_MODAL: {
                dispatch(makeSetEarnProtocolInfoModalAction(true));
                return;
              }
            }
            if (pathname === "/deposit") {
              const validatedModal = validateEarnDepositScreen(
                searchParams.get("cryptoAssetId") || undefined,
                searchParams.get("accountId") || undefined,
              );
              // Handle deposit deeplink on earnLiveAppNavigator
              // Creating own search params for deposit deeplink
              url.pathname = "";
              url.searchParams.set("action", "deposit");
              url.searchParams.set("cryptoAssetId", validatedModal.cryptoAssetId ?? "");
              url.searchParams.set("accountId", validatedModal.accountId ?? "");
              return getStateFromPath(url.href?.split("://")[1], config);
            }
          }
          if ((hostname === "discover" || hostname === "recover") && platform) {
            if (!hasCompletedOnboarding && !platform.startsWith("protect")) return undefined;
            /**
             * Upstream validation of "ledgerlive://discover/:platform":
             *  - checking that a manifest exists
             *  - adding "name" search param
             * */
            if (!liveAppProviderInitialized) {
              /**
               * The provider isn't initialized yet so the manifest will possibly
               * not be found.
               * We redirect because this scenario happens when deep linking
               * triggers a cold app start. The platform app screen will show an
               * error in case the app isn't found.
               */
              return getStateFromPath(path, config);
            }

            const manifest = manifests.find(m => m.id.toLowerCase() === platform.toLowerCase());
            if (!manifest) return undefined;
            url.pathname = `/${manifest.id}`;
            url.searchParams.set("name", manifest.name);
            return getStateFromPath(url.href?.split("://")[1], config);
          }

          return getStateFromPath(path, config);
        },
      } as LinkingOptions<ReactNavigation.RootParamList>
    );
  }, [
    hasCompletedOnboarding,
    llmAccountListUI?.enabled,
    AccountsListScreenName,
    userAcceptedTerms,
    onDeeplinkReceived,
    buySellUiManifestId,
    dispatch,
    shouldDisplayMarketBanner,
    liveAppProviderInitialized,
    manifests,
  ]);
  const [isReady, setIsReady] = React.useState(false);
  const [isNavigationContainerReady, setIsNavigationContainerReady] = React.useState(false);

  useEffect(() => {
    if (userAcceptedTerms === null) return;
    setIsReady(true);
  }, [userAcceptedTerms]);

  useEffect(
    () => () => {
      if (isReadyRef.current) {
        isReadyRef.current = false;
      }
    },
    [],
  );

  const animSplash = useFeature("llmAnimatedSplashScreen");
  const showAnimatedSplashScreen = useRef(
    (animSplash?.enabled && animSplash.params?.[Platform.OS]) ?? true,
  );
  const SplashScreenComponent = useRef(
    showAnimatedSplashScreen.current ? AppLoadingManager : SplashScreenHandle,
  );

  return (
    <View style={styles.appBackground}>
      <SplashScreenComponent.current
        isNavigationReady={isReady && isNavigationContainerReady}
        onAppReady={handleStartComplete}
      >
        {isReady ? (
          <NavigationContainer
            theme={theme}
            linking={linking}
            ref={navigationRef}
            onReady={() => {
              setIsNavigationContainerReady(true);
              isReadyRef.current = true;
            }}
          >
            {children}
          </NavigationContainer>
        ) : null}
      </SplashScreenComponent.current>
    </View>
  );
};
