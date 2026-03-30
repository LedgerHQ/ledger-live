import { useRef, useMemo } from "react";
import { Linking } from "react-native";
import { LinkingOptions } from "@react-navigation/native";
import Config from "react-native-config";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { ScreenName, NavigatorName } from "~/const";
import { navigationRef } from "~/rootnavigation";
import { setWallectConnectUri } from "~/actions/walletconnect";
import { blockPasswordLock } from "~/actions/appstate";
import { track } from "~/analytics";
import { useDispatch } from "~/context/hooks";
import { useDeeplinkDrawerCleanup } from "./useDeeplinkDrawerCleanup";
import {
  linkingOptions,
  getOnboardingLinkingOptions,
  DEEPLINK_SCREEN_CONFIG,
} from "./linkingConfig";
import { isWalletConnectUrl, isWalletConnectLink, getProxyURL, isScreenInState } from "./utils";
import { parseDeepLink } from "./parseDeepLink";
import { executeHandler } from "./registry";

const TRACKING_EVENT = "deeplink_clicked";

export interface UseLinkingParams {
  hasCompletedOnboarding: boolean;
  userAcceptedTerms: boolean | null;
  buySellUiManifestId: string | undefined;
  llmAccountListUIEnabled: boolean | undefined;
  AccountsListScreenName: ScreenName;
  shouldDisplayMarketBanner: boolean;
  shouldDisplayWallet40MainNav: boolean;
  liveAppProviderInitialized: boolean;
  manifests: LiveAppManifest[];
}

/**
 * Builds the React Navigation `LinkingOptions` object.
 *
 * Responsibilities:
 * - Composes static + feature-flag-gated screen configs
 * - Subscribes to incoming URL events (tracking, wallet-connect interception)
 * - Implements `getStateFromPath` by parsing the URL and dispatching to the handler registry
 */
export function useLinking({
  hasCompletedOnboarding,
  userAcceptedTerms,
  buySellUiManifestId,
  llmAccountListUIEnabled,
  AccountsListScreenName,
  shouldDisplayMarketBanner,
  shouldDisplayWallet40MainNav,
  liveAppProviderInitialized,
  manifests,
}: UseLinkingParams): LinkingOptions<ReactNavigation.RootParamList> {
  const dispatch = useDispatch();
  const triggeredAppStartRef = useRef(true);
  const onDeeplinkReceived = useDeeplinkDrawerCleanup();

  return useMemo<LinkingOptions<ReactNavigation.RootParamList>>(
    () =>
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      ({
        ...(hasCompletedOnboarding
          ? {
              ...linkingOptions(),
              config: {
                ...DEEPLINK_SCREEN_CONFIG,
                screens: {
                  ...DEEPLINK_SCREEN_CONFIG.screens,
                  [NavigatorName.Base]: {
                    ...DEEPLINK_SCREEN_CONFIG.screens[NavigatorName.Base],
                    screens: {
                      ...DEEPLINK_SCREEN_CONFIG.screens[NavigatorName.Base].screens,

                      /** "ledgerlive://assets will open assets screen. */
                      ...(llmAccountListUIEnabled && {
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
                      /**
                       * ie: "ledgerlive://swap" -> will redirect to the main swap page
                       * @params ?affiliate: string, ?fromToken: string, ?toToken: string, ?amountFrom: string, ?amountTo: string, ?fromCurrency: string, ?toCurrency: string
                       * ie: "ledgerlive://swap?refererId=lol&fromToken=bitcoin&toToken=ethereum&amountFrom=100&affiliate=partner123"
                       */
                      ...(!shouldDisplayWallet40MainNav && {
                        [NavigatorName.Swap]: {
                          screens: {
                            [ScreenName.SwapTab]: "swap",
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
                              ...(!llmAccountListUIEnabled && {
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

                          /**
                           * ie: "ledgerlive://swap" -> will redirect to the main swap page
                           * @params ?affiliate: string, ?fromToken: string, ?toToken: string, ?amountFrom: string, ?amountTo: string, ?fromCurrency: string, ?toCurrency: string
                           * ie: "ledgerlive://swap?refererId=lol&fromToken=bitcoin&toToken=ethereum&amountFrom=100&affiliate=partner123"
                           */
                          ...(shouldDisplayWallet40MainNav && {
                            [NavigatorName.Swap]: {
                              screens: {
                                [ScreenName.SwapTab]: "swap",
                              },
                            },
                          }),
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
          return () => {
            sub.remove();
          };
        },

        getStateFromPath: (path, config) => {
          const parsed = parseDeepLink(path);
          const { hostname, query } = parsed;
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
          } else {
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
          }

          return executeHandler(parsed, {
            dispatch,
            config,
            hasCompletedOnboarding,
            liveAppProviderInitialized,
            manifests,
            shouldDisplayMarketBanner,
            shouldDisplayWallet40MainNav,
          });
        },
      }) as LinkingOptions<ReactNavigation.RootParamList>,
    [
      hasCompletedOnboarding,
      llmAccountListUIEnabled,
      AccountsListScreenName,
      userAcceptedTerms,
      onDeeplinkReceived,
      buySellUiManifestId,
      dispatch,
      shouldDisplayMarketBanner,
      shouldDisplayWallet40MainNav,
      liveAppProviderInitialized,
      manifests,
    ],
  );
}
