import React, { useRef, useState } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { Web3AppWebview } from "../Web3AppWebview";
import { TopBar } from "./TopBar";
import Box from "../Box";
import { WebviewAPI, WebviewProps, WebviewState } from "../Web3AppWebview/types";
import { initialWebviewState } from "../Web3AppWebview/helpers";
import { usePTXCustomHandlers } from "./CustomHandlers";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
`;

export const Wrapper = styled(Box).attrs(() => ({
  flex: 1,
}))`
  position: relative;
`;

export type CustomLoaderType = React.ComponentType<{
  manifest: LiveAppManifest;
  isLoading: boolean;
}>;

export default function WebPTXPlayer({
  manifest,
  inputs,
  CustomLoader,
}: WebviewProps & { CustomLoader?: CustomLoaderType }) {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(true);

  const accounts = useSelector(flattenAccountsSelector);
  const customHandlers = usePTXCustomHandlers(manifest, accounts);

  return (
    <Container>
      <Wrapper>
        <TopBar manifest={manifest} webviewAPIRef={webviewAPIRef} webviewState={webviewState} />
        <Web3AppWebview
          manifest={manifest}
          inputs={inputs}
          onStateChange={setWebviewState}
          ref={webviewAPIRef}
          customHandlers={customHandlers}
          onWidgetLoadedChange={setIsWidgetLoaded}
        />
        {CustomLoader ? <CustomLoader manifest={manifest} isLoading={!isWidgetLoaded} /> : null}
      </Wrapper>
    </Container>
  );
}
