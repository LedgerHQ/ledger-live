import React, { useRef, useState } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { Web3AppWebview } from "../Web3AppWebview";
import { TopBar, MobileView } from "./TopBar";
import Box from "../Box";
import { WebviewAPI, WebviewProps, WebviewState } from "../Web3AppWebview/types";
import { initialWebviewState } from "../Web3AppWebview/helpers";
import { usePTXCustomHandlers } from "./CustomHandlers";

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

const initialMobileView: MobileView = {
  display: false,
  width: 355,
};
interface WebViewWrapperProps {
  mobileView: MobileView;
}

export const WebViewWrapper = styled.div<WebViewWrapperProps>`
  flex: 1;
  height: 100%;
  display: flex;
  ${({ mobileView }) =>
    mobileView.display ? `width: ${mobileView.width ?? 355}px;` : "width: 100%;"}
`;

export default function WebPTXPlayer({ manifest, inputs, Loader }: WebviewProps) {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const [mobileView, setMobileView] = useState<MobileView>(initialMobileView);

  const accounts = useSelector(flattenAccountsSelector);
  const customHandlers = usePTXCustomHandlers(manifest, accounts);

  return (
    <Container>
      <Wrapper>
        <TopBar
          manifest={manifest}
          webviewAPIRef={webviewAPIRef}
          webviewState={webviewState}
          mobileView={mobileView}
          setMobileView={setMobileView}
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
