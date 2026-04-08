import React from "react";
import { StyleSheet, View } from "react-native";
import type { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { WebviewState } from "~/components/Web3AppWebview/types";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { InfoPanel } from "./InfoPanel";
import { AppProps } from "LLM/features/Web3Hub/types";
import Header from "../Header";
import useWeb3PlayerViewModel, { type Web3PlayerViewModelValues } from "./useWeb3PlayerViewModel";

export type Web3PlayerScreenProps = {
  manifest: AppManifest;
  inputs?: Record<string, string | undefined>;
  webviewState: WebviewState;
  setWebviewState: React.Dispatch<React.SetStateAction<WebviewState>>;
  navigation: AppProps["navigation"];
  initialLoad: boolean;
  secure: boolean;
  baseUrl: string;
};

export type Web3PlayerViewProps = Web3PlayerScreenProps & Web3PlayerViewModelValues;

const Web3PlayerView = ({
  manifest,
  inputs,
  webviewState,
  setWebviewState,
  navigation,
  initialLoad,
  secure,
  baseUrl,
  webviewAPIRef,
  isInfoPanelOpened,
  setIsInfoPanelOpened,
  currentAccountHistDb,
  setCurrentAccountHistDb,
  currentAccountHistDbLoaded,
  customHandlers,
}: Web3PlayerViewProps) => {
  return (
    <View style={styles.root}>
      <Header
        navigation={navigation}
        initialLoad={initialLoad}
        secure={secure}
        baseUrl={baseUrl}
        manifest={manifest}
        setCurrentAccountHistDb={setCurrentAccountHistDb}
        webviewAPIRef={webviewAPIRef}
        webviewState={webviewState}
        setIsInfoPanelOpened={setIsInfoPanelOpened}
      />
      <Web3AppWebview
        ref={webviewAPIRef}
        manifest={manifest}
        currentAccountHistDb={currentAccountHistDb}
        setCurrentAccountHistDb={setCurrentAccountHistDb}
        currentAccountHistDbLoaded={currentAccountHistDbLoaded}
        inputs={inputs}
        onStateChange={setWebviewState}
        customHandlers={customHandlers}
      />
      <InfoPanel
        name={manifest.name}
        icon={manifest.icon}
        url={manifest.homepageUrl}
        uri={webviewState.url.toString()}
        description={manifest.content.description}
        isOpened={isInfoPanelOpened}
        setIsOpened={setIsInfoPanelOpened}
      />
    </View>
  );
};

export default function Web3Player(props: Web3PlayerScreenProps) {
  const viewModel = useWeb3PlayerViewModel({
    manifest: props.manifest,
    webviewState: props.webviewState,
  });

  return <Web3PlayerView {...props} {...viewModel} />;
}

export { Web3PlayerView };

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
