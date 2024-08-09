import React, { useMemo } from "react";
import { useTheme } from "styled-components/native";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import type { AppProps } from "LLM/features/Web3Hub/types";
import WebPlatformPlayer from "./components/Web3Player";
import GenericErrorView from "~/components/GenericErrorView";
import { useLocale } from "~/context/Locale";
import useWeb3HubAppViewModel from "./useWeb3HubAppViewModel";

const appManifestNotFoundError = new Error("App not found");

// TODO local manifests ?
export default function Web3HubApp({ route }: AppProps) {
  const { manifestId, queryParams } = route.params;
  const { theme } = useTheme();
  const { locale } = useLocale();

  const { manifest, isLoading } = useWeb3HubAppViewModel(manifestId);

  const inputs = useMemo(() => {
    return {
      theme,
      lang: locale,
      ...queryParams,
    };
  }, [locale, queryParams, theme]);

  return manifest ? (
    <WebPlatformPlayer manifest={manifest} inputs={inputs} />
  ) : (
    <Flex flex={1} p={10} justifyContent="center" alignItems="center">
      {isLoading ? <InfiniteLoader /> : <GenericErrorView error={appManifestNotFoundError} />}
    </Flex>
  );
}
