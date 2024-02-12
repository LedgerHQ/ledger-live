import React from "react";
import { useSelector } from "react-redux";
import Card from "~/renderer/components/Box/Card";
import { counterValueCurrencySelector, languageSelector } from "~/renderer/reducers/settings";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import WebPlatformPlayer from "~/renderer/components/WebPlatformPlayer";
import useTheme from "~/renderer/hooks/useTheme";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { useHistory, useLocation } from "react-router-dom";
import { WebviewProps } from "~/renderer/components/Web3AppWebview/types";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import { captureException } from "~/sentry/internal";
import { UnableToLoadSwapLiveError } from "~/renderer/screens/exchange/Swap2/Form/SwapWebView";

const DEFAULT_SWAP_APP_ID = "swapWeb";

const Swap = () => {
  const history = useHistory();
  const location = useLocation();
  const locale = useSelector(languageSelector);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const localManifest = useLocalLiveAppManifest(DEFAULT_SWAP_APP_ID);
  const remoteManifest = useRemoteLiveAppManifest(DEFAULT_SWAP_APP_ID);
  const manifest = localManifest || remoteManifest;
  const themeType = useTheme().colors.palette.type;
  const params = location.state || {};

  const handleCrash = useDebounce(() => {
    console.log("[swap web player] Unable to load live app", {
      shouldLogAsSentryException: true,
      shouldGoBack: true,
    });
    captureException(
      new UnableToLoadSwapLiveError(
        "Failed to load swap live app using WebPlatformPlayer in SwapWeb",
      ),
    );
    history.goBack();
  }, 500);

  const onStateChange: WebviewProps["onStateChange"] = state => {
    console.log("[swap web player] state changed", {
      loading: state.loading,
      isAppUnavailable: state.isAppUnavailable,
    });
    if (!state.loading && state.isAppUnavailable) {
      handleCrash?.();
    }
  };

  return (
    // TODO: Remove @ts-ignore after Card component be compatible with TS
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <Card grow style={{ overflow: "hidden" }} data-test-id="swap-app-container">
      {manifest ? (
        <WebPlatformPlayer
          config={{
            topBarConfig: {
              shouldDisplayName: false,
              shouldDisplayInfo: false,
              shouldDisplayClose: false,
              shouldDisplayNavigation: false,
            },
          }}
          manifest={manifest}
          inputs={{
            theme: themeType,
            lang: locale,
            currencyTicker: fiatCurrency.ticker,
            ...params,
          }}
          onStateChange={onStateChange}
        />
      ) : null}
    </Card>
  );
};

export default Swap;
