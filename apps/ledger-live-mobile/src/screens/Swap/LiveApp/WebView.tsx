import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { currentAccountAtom } from "@ledgerhq/live-common/wallet-api/useDappLogic";
import { Flex } from "@ledgerhq/native-ui";
import React from "react";
import { Platform } from "react-native";
import { useSelector } from "react-redux";
import { useTheme } from "styled-components/native";
import { ScopeProvider } from "jotai-scope";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { WebviewState } from "~/components/Web3AppWebview/types";
import { getCountryLocale } from "~/helpers/getStakeLabelLocaleBased";
import { useSettings } from "~/hooks";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  exportSettingsSelector,
  lastSeenDeviceSelector,
} from "~/reducers/settings";
import { useSwapLiveAppCustomHandlers } from "./hooks/useSwapLiveAppCustomHandlers";

type Props = {
  manifest: LiveAppManifest;
  setWebviewState: React.Dispatch<React.SetStateAction<WebviewState>>;
};

export function WebView({ manifest, setWebviewState }: Props) {
  const customHandlers = useSwapLiveAppCustomHandlers(manifest);
  const { theme } = useTheme();
  const { language } = useSettings();
  const { ticker: currencyTicker } = useSelector(counterValueCurrencySelector);
  const discreet = useSelector(discreetModeSelector);
  const countryLocale = getCountryLocale();
  const SWAP_API_BASE = useEnv("SWAP_API_BASE");
  const SWAP_USER_IP = useEnv("SWAP_USER_IP");
  const exportSettings = useSelector(exportSettingsSelector);
  const devMode = exportSettings.developerModeEnabled.toString();
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);

  // ScopeProvider required to prevent conflicts between Swap's Webview instance and deeplink instances
  return (
    <Flex flex={1}>
      <ScopeProvider atoms={[currentAccountAtom]}>
        <Web3AppWebview
          manifest={manifest}
          customHandlers={customHandlers}
          onStateChange={setWebviewState}
          inputs={{
            swapApiBase: SWAP_API_BASE,
            swapUserIp: SWAP_USER_IP,
            devMode,
            theme,
            lang: language,
            locale: language, // LLM doesn't support different locales. By doing this we don't have to have specific LLM/LLD logic in earn, and in future if LLM supports locales we will change this from `language` to `locale`
            countryLocale,
            currencyTicker,
            lastSeenDevice: lastSeenDevice?.modelId,
            discreetMode: discreet ? "true" : "false",
            OS: Platform.OS,
            platform: "LLM", // need consitent format with LLD, Platform doesn't work
          }}
        />
      </ScopeProvider>
    </Flex>
  );
}
