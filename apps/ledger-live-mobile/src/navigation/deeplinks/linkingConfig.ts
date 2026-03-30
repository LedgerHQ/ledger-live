import { Linking } from "react-native";
import Braze from "@braze/react-native-sdk";
import { ScreenName, NavigatorName } from "~/const";
import { getProxyURL } from "./utils";

// FIXME: We will be fixing the universal links in this epic : https://ledgerhq.atlassian.net/browse/LIVE-14732
export const DEEPLINK_PREFIXES = [
  "ledgerwallet://",
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
];

/**
 * Static React Navigation screen config.
 * Covers all routes that do not depend on runtime feature flags.
 * Dynamic (flag-gated) screen entries are merged in useLinking.
 */
export const DEEPLINK_SCREEN_CONFIG = {
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
};

/**
 * Static React Navigation linking configuration.
 * Covers all routes that do not depend on runtime feature flags.
 * Dynamic (flag-gated) screen entries are merged in useLinking.
 */
export const linkingOptions = () => ({
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (url) {
      return getProxyURL(url);
    }
    const brazeUrl: string | null = await new Promise(resolve => {
      Braze.getInitialPushPayload(payload => resolve(payload?.url ?? null));
    });
    return brazeUrl ? getProxyURL(brazeUrl) : null;
  },

  prefixes: DEEPLINK_PREFIXES,
  config: DEEPLINK_SCREEN_CONFIG,
});

/**
 * Linking configuration used during the onboarding flow.
 * Only a subset of routes are available before onboarding is complete.
 */
export const getOnboardingLinkingOptions = (acceptedTermsOfUse: boolean) => ({
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
