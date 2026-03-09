import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box, Spinner } from "@ledgerhq/lumen-ui-rnative";
import type { AppProps } from "LLM/features/Web3Hub/types";
import { useWebviewScrollHandler } from "LLM/features/Web3Hub/hooks/useScrollHandler";
import WebPlatformPlayer from "./components/Web3Player";
import GenericErrorView from "~/components/GenericErrorView";
import useWeb3HubAppViewModel from "./useWeb3HubAppViewModel";
import { TOTAL_HEADER_HEIGHT } from "./components/Header";
import { TrackScreen } from "~/analytics";

const appManifestNotFoundError = new Error("App not found");

const edges = ["top", "bottom", "left", "right"] as const;

// TODO local manifests ?
export default function Web3HubApp({ navigation, route }: AppProps) {
  const { onScroll } = useWebviewScrollHandler(TOTAL_HEADER_HEIGHT);

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

      {manifest ? (
        <WebPlatformPlayer
          navigation={navigation}
          manifest={manifest}
          inputs={inputs}
          onScroll={onScroll}
          webviewState={webviewState}
          setWebviewState={setWebviewState}
          initialLoad={initialLoad}
          secure={secure}
          baseUrl={baseUrl}
        />
      ) : (
        <Box lx={{ flex: 1, padding: "s16", justifyContent: "center", alignItems: "center" }}>
          {isLoading ? <Spinner /> : <GenericErrorView error={appManifestNotFoundError} />}
        </Box>
      )}
    </SafeAreaView>
  );
}
