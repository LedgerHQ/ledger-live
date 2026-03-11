import React, { useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useSelector } from "LLD/hooks/redux";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { Web3AppWebview } from "../Web3AppWebview";
import { TopBar } from "./TopBar";
import Box from "../Box";
import { WebviewAPI, WebviewProps, WebviewState } from "../Web3AppWebview/types";
import { initialWebviewState } from "../Web3AppWebview/helpers";
import { usePTXCustomHandlers } from "./CustomHandlers";
import { useMobileView, WebViewWrapperProps } from "~/renderer/hooks/useMobileView";
import { useDeeplinkCustomHandlers } from "../WebPlatformPlayer/CustomHandlers";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { usePerpsHandlers } from "./PerpsHandlers";

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

export const WebViewWrapper = styled.div<WebViewWrapperProps>`
  flex: 1;
  height: 100%;
  display: flex;
  ${({ mobileView }) =>
    mobileView.display ? `width: ${mobileView.width ?? 355}px;` : "width: 100%;"}
`;

export type WebPTXPlayerProps = WebviewProps & {
  /** Base route path for this player (e.g. "/card", "/exchange"). Used for redirect navigation. */
  basePath: string;
};

export default function WebPTXPlayer({ manifest, inputs, Loader, basePath }: WebPTXPlayerProps) {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const { mobileView, setMobileView } = useMobileView();

  const accounts = useSelector(flattenAccountsSelector);

  const customPTXHandlers = usePTXCustomHandlers(manifest, accounts);
  const customDeeplinkHandlers = useDeeplinkCustomHandlers();
  const customPerpsHandlers = usePerpsHandlers(accounts);

  const customHandlers = useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...customPTXHandlers,
      ...customDeeplinkHandlers,
      ...customPerpsHandlers,
    };
  }, [customDeeplinkHandlers, customPTXHandlers, customPerpsHandlers]);

  return (
    <Container>
      <Wrapper>
        <TopBar
          manifest={manifest}
          webviewAPIRef={webviewAPIRef}
          webviewState={webviewState}
          mobileView={mobileView}
          setMobileView={setMobileView}
          basePath={basePath}
        />
        <WebViewWrapper mobileView={mobileView}>
          <Web3AppWebview
            manifest={manifest}
            inputs={inputs}
            onStateChange={setWebviewState}
            ref={webviewAPIRef}
            customHandlers={customHandlers}
            Loader={Loader}
          />
        </WebViewWrapper>
      </Wrapper>
    </Container>
  );
}
