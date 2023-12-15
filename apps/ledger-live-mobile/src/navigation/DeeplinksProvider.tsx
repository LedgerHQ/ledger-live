import React, { useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Linking } from "react-native";
import SplashScreen from "react-native-splash-screen";
import { getStateFromPath, LinkingOptions, NavigationContainer } from "@react-navigation/native";
import Config from "react-native-config";
import { useFlipper } from "@react-navigation/devtools";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { DEFAULT_MULTIBUY_APP_ID } from "@ledgerhq/live-common/wallet-api/constants";

import Braze from "@braze/react-native-sdk";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
import * as Sentry from "@sentry/react-native";

import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import { navigationRef, isReadyRef } from "../rootnavigation";
import { ScreenName, NavigatorName } from "~/const";
import { setWallectConnectUri } from "~/actions/walletconnect";
import { useGeneralTermsAccepted } from "~/logic/terms";
import { Writeable } from "~/types/helpers";
import { lightTheme, darkTheme, Theme } from "../colors";
import { track } from "~/analytics";
import { setEarnInfoModal } from "~/actions/earn";
import { OptionalFeatureMap } from "@ledgerhq/types-live";
import { blockPasswordLock } from "../actions/appstate";
import { useStorylyContext } from "~/components/StorylyStories/StorylyProvider";

const routingInstrumentation = new Sentry.ReactNavigationInstrumentation();

const themes: {
  [key: string]: Theme;
} = {
  light: lightTheme,
  dark: darkTheme,
};

function isWalletConnectUrl(url: string) {
  return url.substring(0, 3) === "wc:";
}
function isWalletConnectLink(url: string) {
  return (
    isWalletConnectUrl(url) ||
    url.substring(0, 20) === "ledgerlive://wc" ||
    url.substring(0, 26) === "https://ledger.com/wc"
  );
}

function isStorylyLink(url: string) {
  return url.startsWith("ledgerlive://storyly?");
}

// https://docs.walletconnect.com/mobile-linking#wallet-support
function isValidWalletConnectUrl(_url: string) {
  let url = _url;
  if (!isWalletConnectUrl(url)) {
    const uri = new URL(url).searchParams.get("uri");
    if (!uri) {
      return false;
    }
    url = uri;
  }
  const { protocol, search } = new URL(url);
  return protocol === "wc:" && search;
}
function isInvalidWalletConnectLink(url: string) {
  if (!isWalletConnectLink(url) || isValidWalletConnectUrl(url)) {
    return false;
  }
  return true;
}

function getProxyURL(url: string) {
  const uri = new URL(url);
  const { hostname, pathname } = uri;
  const platform = pathname.split("/")[1];

  if (hostname === "discover" && platform && platform.startsWith("protect")) {
    return url.replace("://discover", "://recover");
  }

  if (isWalletConnectUrl(url)) {
    return `ledgerlive://wc?uri=${encodeURIComponent(url)}`;
  }

  // This is to handle links set in the useFromAmountStatusMessage in LLC.
  // Also handles a difference in paths between LLD on LLD /platform/:app_id
  // but on LLM /discover/:app_id
  if (hostname === "platform" && [DEFAULT_MULTIBUY_APP_ID].includes(platform)) {
    return url.replace("://platform", "://discover");
  }

  return url;
}

// DeepLinking
const linkingOptions = (featureFlags: OptionalFeatureMap) => ({
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (url) {
      return url && !isInvalidWalletConnectLink(url) ? getProxyURL(url) : null;
    }
    const brazeUrl: string = await new Promise(resolve => {
      Braze.getInitialURL(initialUrl => {
        resolve(initialUrl);
      });
    });
    return brazeUrl && !isInvalidWalletConnectLink(brazeUrl) ? getProxyURL(brazeUrl) : null;
  },

  prefixes: [
    "ledgerlive://",
    "https://ledger.com",
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
          [NavigatorName.PostOnboarding]: {
            screens: {
              /**
               * @params ?completed: boolean
               * ie: "ledgerlive://post-onboarding/nft-claimed?completed=true" will open the post onboarding hub and complete the Nft claim action
               * * @params ?allCompleted: boolean
               * ie: "ledgerlive://post-onboarding/nft-claimed?allCompleted=true" will open the post onboarding hub with all steps completed
               */
              [ScreenName.PostOnboardingHub]: "post-onboarding/nft-claimed",
            },
          },

          [NavigatorName.ClaimNft]: {
            screens: {
              /**
               * ie: "ledgerlive://linkdrop-nft-claim/qr-scanning" will redirect to the QR scanning page
               */
              [ScreenName.ClaimNftQrScan]: "linkdrop-nft-claim/qr-scanning",
            },
          },

          /**
           * @params ?platform: string
           * ie: "ledgerlive://discover/paraswap?theme=light" will open the catalog and the paraswap dapp with a light theme as parameter
           */
          [ScreenName.PlatformApp]: "discover/:platform",
          [ScreenName.Recover]: "recover/:platform",
          [NavigatorName.Main]: {
            initialRouteName: ScreenName.Portfolio,
            screens: {
              /**
               * ie: "ledgerlive://portfolio" -> will redirect to the portfolio
               */

              [NavigatorName.Portfolio]: {
                screens: {
                  [NavigatorName.PortfolioAccounts]: {
                    screens: {
                      /**
                       * "ledgerlive://accounts" opens the main portfolio screen of accounts.
                       */
                      [ScreenName.Accounts]: "accounts",
                    },
                  },
                  [NavigatorName.WalletTab]: {
                    screens: {
                      [ScreenName.Portfolio]: "portfolio",
                      [ScreenName.WalletNftGallery]: "nftgallery",

                      ...(featureFlags?.ptxEarn?.enabled && {
                        [NavigatorName.Market]: {
                          screens: {
                            /**
                             * ie: "ledgerlive://market" will open the market screen
                             */
                            [ScreenName.MarketList]: "market",
                          },
                        },
                      }),
                    },
                  },
                },
              },
              ...(!featureFlags?.ptxEarn?.enabled && {
                [NavigatorName.Market]: {
                  screens: {
                    /**
                     * ie: "ledgerlive://market" will open the market screen
                     */
                    [ScreenName.MarketList]: "market",
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
              [NavigatorName.Manager]: {
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
                  [ScreenName.Manager]: "myledger",
                },
              },
            },
          },
          [NavigatorName.ReceiveFunds]: {
            screens: {
              /**
               * @params ?currency: string
               * ie: "ledgerlive://receive?currency=bitcoin" will open the prefilled search account in the receive flow
               */
              [ScreenName.ReceiveSelectCrypto]: "receive",
            },
          },
          /**
           * ie: "ledgerlive://swap" -> will redirect to the main swap page
           */
          [NavigatorName.Swap]: "swap",

          [NavigatorName.SendFunds]: {
            screens: {
              /**
               * @params ?currency: string
               * ie: "ledgerlive://send?currency=bitcoin" will open the prefilled search account in the send flow
               */
              [ScreenName.SendCoin]: "send",
            },
          },
          /** "ledgerlive://account" will open the list of all accounts, where the redirection logic is. */
          [NavigatorName.Accounts]: {
            screens: {
              /**
               * @params ?currency: string
               * @params ?address: string
               * ie: "ledgerlive://account?currency=ethereum&address={{eth_account_address}} will open that account's assets screen.
               * Currency param alone e.g. "ledgerlive://account?currency=tezos" will open the Tezos Assets screen.
               */
              [ScreenName.Accounts]: "account",
            },
          },

          [NavigatorName.AddAccounts]: {
            screens: {
              /**
               * ie: "ledgerlive://add-account" will open the add account flow
               *
               * @params ?currency: string
               * ie: "ledgerlive://add-account?currency=bitcoin" will open the add account flow with "bitcoin" prefilled in the search input
               *
               */
              [ScreenName.AddAccountsSelectCrypto]: "add-account",
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
            initialRouteName: [ScreenName.SettingsScreen],
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
          [NavigatorName.ExploreTab]: {
            initialRouteName: "explore",
            screens: {
              /**
               * ie: "ledgerlive://learn"
               */
              [ScreenName.Newsfeed]: "newsfeed",
              [ScreenName.Learn]: "learn",
            },
          },
          [NavigatorName.ImportAccounts]: {
            screens: {
              /**
               * ie: "ledgerlive://ScanAccounts"
               */
              [ScreenName.ScanAccounts]: "scan-accounts",
            },
          },
        },
      },
    },
  },
});

const getOnboardingLinkingOptions = (
  acceptedTermsOfUse: boolean,
  featureFlags: OptionalFeatureMap,
) => ({
  ...linkingOptions(featureFlags),
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

export const DeeplinksProvider = ({
  children,
  resolvedTheme,
}: {
  children: React.ReactNode;
  resolvedTheme: "light" | "dark";
}) => {
  const dispatch = useDispatch();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const ptxEarnFeature = useFeature("ptxEarn");
  const features = useMemo(
    () => (ptxEarnFeature ? { ptxEarn: ptxEarnFeature } : {}),
    [ptxEarnFeature],
  );

  const { state } = useRemoteLiveAppContext();
  const liveAppProviderInitialized = !!state.value || !!state.error;
  const manifests = state?.value?.liveAppByIndex || emptyObject;
  // Can be either true, false or null, meaning we don't know yet
  const userAcceptedTerms = useGeneralTermsAccepted();
  const storylyContext = useStorylyContext();

  const linking = useMemo<LinkingOptions<ReactNavigation.RootParamList>>(
    () =>
      ({
        ...(hasCompletedOnboarding
          ? linkingOptions(features)
          : getOnboardingLinkingOptions(!!userAcceptedTerms, features)),
        subscribe(listener) {
          const sub = Linking.addEventListener("url", ({ url }) => {
            // Prevent default deeplink if invalid wallet connect link
            if (isInvalidWalletConnectLink(url)) {
              return;
            }

            // Prevent default deeplink if we're already in a wallet connect route.
            const route = navigationRef.current?.getCurrentRoute();
            if (
              isWalletConnectLink(url) &&
              route &&
              (route.name as ScreenName) === ScreenName.WalletConnectConnect
            ) {
              const uri = isWalletConnectUrl(url)
                ? url
                : // we know uri exists in the searchParams because we check it in isValidWalletConnectUrl
                  new URL(url).searchParams.get("uri")!;
              dispatch(setWallectConnectUri(uri));
              return;
            }
            if (isStorylyLink(url)) {
              storylyContext.setUrl(url);
            }

            listener(getProxyURL(url));
          });
          // Clean up the event listeners
          return () => {
            sub.remove();
          };
        },
        getStateFromPath: (path, config) => {
          const url = new URL(`ledgerlive://${path}`);
          const { hostname, searchParams, pathname } = url;
          const query = Object.fromEntries(searchParams);

          const {
            ajs_prop_campaign: ajsPropCampaign,
            ajs_prop_track_data: ajsPropTrackData,
            ajs_prop_source: ajsPropSource,
            currency,
            installApp,
            appName,
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

          // Track deeplink only when ajsPropSource attribute exists.
          if (ajsPropSource) {
            track("deeplink_clicked", {
              deeplinkSource: ajsPropSource,
              deeplinkCampaign: ajsPropCampaign,
              url: hostname,
              currency,
              installApp,
              appName,
              ...(ajsPropTrackData ? JSON.parse(ajsPropTrackData) : {}),
            });
          }
          const platform = pathname.split("/")[1];

          if (hostname === "earn") {
            if (searchParams.get("action") === "info-modal") {
              const message = searchParams.get("message") || "";
              const messageTitle = searchParams.get("messageTitle") || "";

              dispatch(
                setEarnInfoModal({
                  message,
                  messageTitle,
                }),
              );
              return;
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
          if (path === "linkdrop-nft-claim/qr-scanning") {
            track("deeplink", { action: "Claim NFT scan QR code again" });
          }

          return getStateFromPath(path, config);
        },
      }) as LinkingOptions<ReactNavigation.RootParamList>,
    [
      hasCompletedOnboarding,
      features,
      userAcceptedTerms,
      dispatch,
      storylyContext,
      liveAppProviderInitialized,
      manifests,
    ],
  );
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    if (userAcceptedTerms === null) return;
    setIsReady(true);
  }, [userAcceptedTerms]);

  React.useEffect(
    () => () => {
      (isReadyRef as Writeable<typeof isReadyRef>).current = false;
    },
    [],
  );

  useFlipper(navigationRef);

  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer
      theme={themes[resolvedTheme]}
      linking={linking}
      ref={navigationRef}
      onReady={() => {
        (isReadyRef as Writeable<typeof isReadyRef>).current = true;
        setTimeout(() => SplashScreen.hide(), 300);
        routingInstrumentation.registerNavigationContainer(navigationRef);
      }}
    >
      {children}
    </NavigationContainer>
  );
};
