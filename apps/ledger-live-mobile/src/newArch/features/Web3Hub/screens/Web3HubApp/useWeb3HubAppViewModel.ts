import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "styled-components/native";
import { fetchManifestById, fetchManifestByIdMock } from "LLM/features/Web3Hub/utils/api/manifests";
import type { AppProps } from "LLM/features/Web3Hub/types";
import { WebviewState } from "~/components/Web3AppWebview/types";
import { initialWebviewState } from "~/components/Web3AppWebview/helpers";
import { useLocale } from "~/context/Locale";

export const queryKey = (manifestId: string, locale: string) => [
  "web3hub/manifest",
  manifestId,
  locale,
];

const isInTest = process.env.NODE_ENV === "test" || !!process.env.MOCK_WEB3HUB;
const queryFn = isInTest ? fetchManifestByIdMock : fetchManifestById;

export default function useWeb3HubAppViewModel(routeParams: AppProps["route"]["params"]) {
  const { manifestId, queryParams } = routeParams;
  const { theme } = useTheme();
  const { locale } = useLocale();

  const { data: manifest, isLoading } = useQuery({
    queryKey: queryKey(manifestId, locale),
    queryFn: queryFn(manifestId, locale),
  });

  const inputs = useMemo(() => {
    return {
      theme,
      lang: locale,
      ...queryParams,
    };
  }, [locale, queryParams, theme]);

  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);

  const [baseUrl, secure, initialLoad] = useMemo(() => {
    if (manifest?.params && "dappUrl" in manifest.params) {
      const url = new URL(manifest.params.dappUrl);
      return [url.hostname, url.protocol === "https:", false];
    }

    if (!webviewState.url) {
      if (webviewState.loading && manifest?.url) {
        const url = new URL(webviewState.url);
        return [url.hostname, url.protocol === "https:", false];
      }

      return ["", false, true];
    }
    const url = new URL(webviewState.url);
    return [url.hostname, url.protocol === "https:", false];
  }, [manifest?.params, manifest?.url, webviewState.loading, webviewState.url]);

  return {
    manifest,
    isLoading,
    inputs,
    webviewState,
    setWebviewState,
    baseUrl,
    secure,
    initialLoad,
  };
}
