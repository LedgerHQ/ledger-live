import React, { useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { handlers as loggerHandlers } from "@ledgerhq/live-common/wallet-api/CustomLogger/server";
import { Web3AppWebview } from "../Web3AppWebview";
import { TopBar, TopBarConfig } from "./TopBar";
import Box from "../Box";
import { WebviewAPI, WebviewProps, WebviewState } from "../Web3AppWebview/types";
import { initialWebviewState } from "../Web3AppWebview/helpers";
import { usePTXCustomHandlers } from "../WebPTXPlayer/CustomHandlers";

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

export type WebPlatformPlayerConfig = {
  topBarConfig?: TopBarConfig;
};

type Props = {
  onClose?: () => void;
  config?: WebPlatformPlayerConfig;
} & WebviewProps;

export default function WebPlatformPlayer({ manifest, inputs, onClose, config, ...props }: Props) {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);

  const customPTXHandlers = usePTXCustomHandlers(manifest);

  const customHandlers = useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...loggerHandlers,
      ...customPTXHandlers,
    };
  }, [customPTXHandlers]);

  const onStateChange: WebviewProps["onStateChange"] = state => {
    setWebviewState(state);
    props.onStateChange?.(state);
  };

  return (
    <Container>
      <Wrapper>
        <TopBar
          manifest={manifest}
          onClose={onClose}
          webviewAPIRef={webviewAPIRef}
          webviewState={webviewState}
          config={config?.topBarConfig}
        />
        <Web3AppWebview
          manifest={manifest}
          inputs={inputs}
          onStateChange={onStateChange}
          ref={webviewAPIRef}
          customHandlers={customHandlers}
        />
      </Wrapper>
    </Container>
  );
}
