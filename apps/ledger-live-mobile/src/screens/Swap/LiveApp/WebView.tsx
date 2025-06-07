import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { currentAccountAtom } from "@ledgerhq/live-common/wallet-api/useDappLogic";
import { Flex } from "@ledgerhq/native-ui";
import React, { useRef } from "react";
import { Platform } from "react-native";
import { useSelector } from "react-redux";
import { useTheme } from "styled-components/native";
import { ScopeProvider } from "jotai-scope";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { WebviewState } from "~/components/Web3AppWebview/types";
import { getCountryLocale } from "~/helpers/getStakeLabelLocaleBased";
import { useSettings } from "~/hooks";
import {
  analyticsEnabledSelector,
  counterValueCurrencySelector,
  exportSettingsSelector,
  lastSeenDeviceSelector,
} from "~/reducers/settings";
import { DefaultAccountSwapParamList } from "../types";
import { useDispatch } from "react-redux";
import { useTranslateToSwapAccount } from "./hooks/useTranslateToSwapAccount";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { useSwapCustomHandlers } from "./customHandlers";

type Props = {
  manifest: LiveAppManifest;
  params: DefaultAccountSwapParamList | null;
  setWebviewState: React.Dispatch<React.SetStateAction<WebviewState>>;
};

export function WebView({ manifest, params, setWebviewState }: Props) {
  // Swap duplicated the Custom Handlers due to different needs compared to the rest of the platform apps,
  // to avoid complexifying the logic in the shared custom handlers.
  const accounts = useSelector(flattenAccountsSelector);
  const dispatch = useDispatch();
  const customHandlers = useSwapCustomHandlers(manifest, accounts, dispatch);
  const { theme } = useTheme();
  const { language } = useSettings();
  const { ticker: currencyTicker } = useSelector(counterValueCurrencySelector);
  const countryLocale = getCountryLocale();
  const SWAP_API_BASE = useEnv("SWAP_API_BASE");
  const SWAP_USER_IP = useEnv("SWAP_USER_IP");
  const exportSettings = useSelector(exportSettingsSelector);
  const shareAnalytics = useSelector(analyticsEnabledSelector).toString();
  const devMode = exportSettings.developerModeEnabled.toString();
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);

  const currentAccounts = useSelector(flattenAccountsSelector);
  const stableCurrentAccounts = useRef(currentAccounts).current; // only consider accounts available upon initial WebView load
  const swapParams = useTranslateToSwapAccount(params, stableCurrentAccounts);

  // ScopeProvider required to prevent conflicts between Swap's Webview instance and deeplink instances
  return (
    <ScopeProvider atoms={[currentAccountAtom]}>
      <Flex flex={1}>
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
            OS: Platform.OS,
            platform: "LLM", // need consistent format with LLD, Platform doesn't work
            shareAnalytics,
            ...swapParams,
          }}
        />
      </Flex>
    </ScopeProvider>
  );
}
