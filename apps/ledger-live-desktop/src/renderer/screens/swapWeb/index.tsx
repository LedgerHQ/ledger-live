import React from "react";
import { useSelector } from "react-redux";
import Card from "~/renderer/components/Box/Card";
import { counterValueCurrencySelector, languageSelector } from "~/renderer/reducers/settings";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import WebPlatformPlayer from "~/renderer/components/WebPlatformPlayer";
import useTheme from "~/renderer/hooks/useTheme";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { useLocation } from "react-router-dom";
import BigNumber from "bignumber.js";

const DEFAULT_SWAP_APP_ID = "swapWeb";

type SwapParamsState =
  | {
      provider?: string;
      fromAccountId: string;
      toAccountId: string;
      fromAmount?: BigNumber;
      quoteId?: string;
      rate?: BigNumber;
      feeStrategy?: string;
      customFeeConfig?: string;
      initFeeTotalValue: BigNumber;
    }
  | undefined;

const Swap = () => {
  const location = useLocation<SwapParamsState>();
  const locale = useSelector(languageSelector);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const localManifest = useLocalLiveAppManifest(DEFAULT_SWAP_APP_ID);
  const remoteManifest = useRemoteLiveAppManifest(DEFAULT_SWAP_APP_ID);
  const manifest = localManifest || remoteManifest;
  const themeType = useTheme().colors.palette.type;
  const params = location.state || {};

  return (
    // TODO: Remove @ts-ignore after Card component be compatible with TS
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <Card grow style={{ overflow: "hidden" }} data-test-id="earn-app-container">
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
          }}
          hash={params}
          onStateChange={webViewState => {
            const url = new URL(webViewState.url);
            const hash = new URLSearchParams(url.hash.substring(1));
            const state = hash.get("state");
            console.log("%cindex.tsx line:65 state", "color: #007acc;", state);
          }}
        />
      ) : null}
    </Card>
  );
};

export default Swap;
