import React, { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "styled-components/native";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import type { AppProps } from "LLM/features/Web3Hub/types";
import { useWebviewScrollHandler } from "LLM/features/Web3Hub/hooks/useScrollHandler";
import WebPlatformPlayer from "./components/Web3Player";
import GenericErrorView from "~/components/GenericErrorView";
import { useLocale } from "~/context/Locale";
import useWeb3HubAppViewModel from "./useWeb3HubAppViewModel";
import Header, { TOTAL_HEADER_HEIGHT } from "./components/Header";

const appManifestNotFoundError = new Error("App not found");

const edges = ["top", "bottom", "left", "right"] as const;

// TODO local manifests ?
export default function Web3HubApp({ navigation, route }: AppProps) {
  const { manifestId, queryParams } = route.params;
  const { theme } = useTheme();
  const { locale } = useLocale();
  const { layoutY, onScroll } = useWebviewScrollHandler(TOTAL_HEADER_HEIGHT);

  const { manifest, isLoading } = useWeb3HubAppViewModel(manifestId);

  const inputs = useMemo(() => {
    return {
      theme,
      lang: locale,
      ...queryParams,
    };
  }, [locale, queryParams, theme]);

  return (
    <SafeAreaView edges={edges} style={{ flex: 1 }}>
      <Header navigation={navigation} layoutY={layoutY} />

      {manifest ? (
        <WebPlatformPlayer
          manifest={manifest}
          inputs={inputs}
          onScroll={onScroll}
          layoutY={layoutY}
        />
      ) : (
        <Flex flex={1} p={10} justifyContent="center" alignItems="center">
          {isLoading ? <InfiniteLoader /> : <GenericErrorView error={appManifestNotFoundError} />}
        </Flex>
      )}
    </SafeAreaView>
  );
}
