import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import type { AppProps } from "LLM/features/Web3Hub/types";
import { useWebviewScrollHandler } from "LLM/features/Web3Hub/hooks/useScrollHandler";
import WebPlatformPlayer from "./components/Web3Player";
import GenericErrorView from "~/components/GenericErrorView";
import useWeb3HubAppViewModel from "./useWeb3HubAppViewModel";
import Header, { TOTAL_HEADER_HEIGHT } from "./components/Header";
import { TrackScreen } from "~/analytics";

const appManifestNotFoundError = new Error("App not found");

const edges = ["top", "bottom", "left", "right"] as const;

// TODO local manifests ?
export default function Web3HubApp({ navigation, route }: AppProps) {
  const { layoutY, onScroll } = useWebviewScrollHandler(TOTAL_HEADER_HEIGHT);

  const {
    manifest,
    isLoading,
    inputs,
    webviewState,
    setWebviewState,
    baseUrl,
    secure,
    initialLoad,
  } = useWeb3HubAppViewModel(route.params);

  return (
    <SafeAreaView edges={edges} style={{ flex: 1 }}>
      <TrackScreen category="Web3Hub" page="App" appId={manifest?.id} />
      {manifest && (
        <Header
          navigation={navigation}
          layoutY={layoutY}
          initialLoad={initialLoad}
          secure={secure}
          baseUrl={baseUrl}
          manifest={manifest}
        />
      )}

      {manifest ? (
        <WebPlatformPlayer
          manifest={manifest}
          inputs={inputs}
          onScroll={onScroll}
          layoutY={layoutY}
          webviewState={webviewState}
          setWebviewState={setWebviewState}
        />
      ) : (
        <Flex flex={1} p={10} justifyContent="center" alignItems="center">
          {isLoading ? <InfiniteLoader /> : <GenericErrorView error={appManifestNotFoundError} />}
        </Flex>
      )}
    </SafeAreaView>
  );
}
