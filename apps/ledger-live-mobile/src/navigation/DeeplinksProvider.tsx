import React, { useContext, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Linking, Platform } from "react-native";
import SplashScreen from "react-native-splash-screen";
import {
  getStateFromPath,
  LinkingOptions,
  NavigationContainer,
} from "@react-navigation/native";
import { useFlipper } from "@react-navigation/devtools";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import Braze from "react-native-appboy-sdk";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

import * as Sentry from "@sentry/react-native";
import { hasCompletedOnboardingSelector } from "../reducers/settings";
import { context as _wcContext } from "../screens/WalletConnect/Provider";
import { navigationRef, isReadyRef } from "../rootnavigation";
import { ScreenName, NavigatorName } from "../const";
import { setWallectConnectUri } from "../actions/walletconnect";
import { TermsContext } from "../logic/terms";
import { Writeable } from "../types/helpers";
import { lightTheme, darkTheme, Theme } from "../colors";
import { track } from "../analytics";

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

const recoverManifests = [
  "protect",
  "protect-simu",
  "protect-staging",
  "protect-preprod",
  "protect-prod",
  "protect-sec",
  "protect-sit",
];

function getProxyURL(url: string) {
  const uri = new URL(url);
  const { hostname, pathname } = uri;
  const platform = pathname.split("/")[1];

  if (
    hostname === "discover" &&
    platform &&
    recoverManifests.includes(platform)
  ) {
    return url.replace("://discover", "://recover");
  }

  if (isWalletConnectUrl(url)) {
    return `ledgerlive://wc?uri=${encodeURIComponent(url)}`;
  }

  return url;
}
// DeepLinking
const linkingOptions = {
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
    return brazeUrl && !isInvalidWalletConnectLink(brazeUrl)
      ? getProxyURL(brazeUrl)
      : null;
  },

  prefixes: ["ledgerlive://", "https://ledger.com"],
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
              [ScreenName.WalletConnectDeeplinkingSelectAccount]: "wc",
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
                  [NavigatorName.WalletTab]: {
                    screens: {
                      [ScreenName.Portfolio]: "portfolio",
                      [ScreenName.WalletNftGallery]: "nftgallery",
                      [NavigatorName.PortfolioAccounts]: {
                        screens: {
                          /**
                           * @params ?currency: string
                           * ie: "ledgerlive://account?currency=bitcoin" will open the first bitcoin account
                           */
                          [ScreenName.Accounts]: "account",
                        },
                      },
                    },
                  },
                },
              },
              [NavigatorName.Market]: {
                screens: {
                  /**
                   * ie: "ledgerlive://market" will open the market screen
                   */
                  [ScreenName.MarketList]: "market",
                },
              },
              [NavigatorName.Discover]: {
                screens:
                  Platform.OS === "ios"
                    ? {}
                    : {
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
          [NavigatorName.Swap]: {
            screens: {
              /**
               * @params ?currency: string
               * ie: "ledgerlive://receive?currency=bitcoin" will open the prefilled search account in the receive flow
               */
              [ScreenName.Swap]: "swap",
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

          [NavigatorName.Accounts]: {
            screens: {
              /**
               * @params ?id: string
               * ie: "ledgerlive://accounts?currency=ethereum&address={{eth_account_address}}"
               */
              [ScreenName.Accounts]: "accounts",
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

          /**
           * ie: "ledgerlive://swap" -> will redirect to the main swap page
           */
          [NavigatorName.Swap]: "swap",
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
};

const getOnboardingLinkingOptions = (acceptedTermsOfUse: boolean) => ({
  ...linkingOptions,
  config: {
    initialRouteName: NavigatorName.BaseOnboarding,
    screens: !acceptedTermsOfUse
      ? {}
      : {
          [NavigatorName.Base]: {
            screens: {
              [ScreenName.PostBuyDeviceScreen]: "hw-purchase-success",
              [ScreenName.BleDevicePairingFlow]: "sync-onboarding",
              /**
               * @params ?platform: string
               * ie: "ledgerlive://discover/protect?theme=light" will open the catalog and the protect dapp with a light theme as parameter
               */
              [ScreenName.PlatformApp]: "discover/:platform",
              [ScreenName.Recover]: "recover/:platform",
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
  const wcContext = useContext(_wcContext);
  const { state } = useRemoteLiveAppContext();
  const liveAppProviderInitialized = !!state.value || !!state.error;
  const manifests = state?.value?.liveAppByIndex || emptyObject;
  // Can be either true, false or null, meaning we don't know yet
  const { accepted: userAcceptedTerms } = useContext(TermsContext);

  const linking = useMemo<LinkingOptions<ReactNavigation.RootParamList>>(
    () =>
      ({
        ...(hasCompletedOnboarding
          ? linkingOptions
          : getOnboardingLinkingOptions(!!userAcceptedTerms)),
        enabled: wcContext.initDone && !wcContext.session.session,
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
              [
                ScreenName.WalletConnectScan,
                ScreenName.WalletConnectDeeplinkingSelectAccount,
                ScreenName.WalletConnectConnect,
              ].includes(route.name as ScreenName)
            ) {
              const uri = isWalletConnectUrl(url)
                ? url
                : // we know uri exists in the searchParams because we check it in isValidWalletConnectUrl
                  new URL(url).searchParams.get("uri")!;
              dispatch(setWallectConnectUri(uri));
              return;
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
          const { hostname, pathname } = url;
          const platform = pathname.split("/")[1];

          if ((hostname === "discover" || hostname === "recover") && platform) {
            const whitelistLiveAppsAccessibleInNonOnboardedLL: LiveAppManifest["id"][] =
              recoverManifests;
            if (
              !hasCompletedOnboarding &&
              !whitelistLiveAppsAccessibleInNonOnboardedLL.includes(platform)
            )
              return undefined;
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

            const manifest = manifests.find(
              m => m.id.toLowerCase() === platform.toLowerCase(),
            );
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
      } as LinkingOptions<ReactNavigation.RootParamList>),
    [
      hasCompletedOnboarding,
      wcContext.initDone,
      wcContext.session.session,
      dispatch,
      liveAppProviderInitialized,
      manifests,
      userAcceptedTerms,
    ],
  );
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    if (!wcContext.initDone) return;
    if (userAcceptedTerms === null) return;
    setIsReady(true);
  }, [wcContext.initDone, userAcceptedTerms]);

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
