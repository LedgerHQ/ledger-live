import React, { useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { handlers as exchangeHandlers } from "@ledgerhq/live-common/wallet-api/Exchange/server";
import { ExchangeType } from "@ledgerhq/live-common/wallet-api/Exchange/types";
import trackingWrapper from "@ledgerhq/live-common/wallet-api/Exchange/tracking";
import { Operation } from "@ledgerhq/types-live";
import { track } from "~/renderer/analytics/segment";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { openExchangeDrawer } from "~/renderer/actions/UI";
import { Web3AppWebview } from "../Web3AppWebview";
import { TopBar } from "./TopBar";
import Box from "../Box";
import { WebviewAPI, WebviewProps, WebviewState } from "../Web3AppWebview/types";
import { initialWebviewState } from "../Web3AppWebview/helpers";

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

function usePTXCustomHandlers(manifest: WebviewProps["manifest"]) {
  const dispatch = useDispatch();
  const accounts = useSelector(flattenAccountsSelector);

  const tracking = useMemo(
    () =>
      trackingWrapper(
        (
          eventName: string,
          properties?: Record<string, unknown> | null,
          mandatory?: boolean | null,
        ) =>
          track(
            eventName,
            {
              ...properties,
              flowInitiatedFrom:
                currentRouteNameRef.current === "Platform Catalog"
                  ? "Discover"
                  : currentRouteNameRef.current,
            },
            mandatory,
          ),
      ),
    [],
  );

  return useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...exchangeHandlers({
        accounts,
        tracking,
        manifest,
        uiHooks: {
          "custom.exchange.start": ({ exchangeType, onSuccess, onCancel }) => {
            dispatch(
              openExchangeDrawer({
                type: "EXCHANGE_START",
                exchangeType: ExchangeType[exchangeType],
                onResult: (nonce: string) => {
                  onSuccess(nonce);
                },
                onCancel: (error: Error) => {
                  onCancel(error);
                },
              }),
            );
          },
          "custom.exchange.complete": ({ exchangeParams, onSuccess, onCancel }) => {
            dispatch(
              openExchangeDrawer({
                type: "EXCHANGE_COMPLETE",
                ...exchangeParams,
                onResult: (operation: Operation) => {
                  onSuccess(operation.hash);
                },
                onCancel: (error: Error) => {
                  console.error(error);
                  onCancel(error);
                },
              }),
            );
          },
        },
      }),
    };
  }, [accounts, dispatch, manifest, tracking]);
}

export default function WebPTXPlayer({ manifest, inputs }: WebviewProps) {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);

  const customHandlers = usePTXCustomHandlers(manifest);

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
        />
      </Wrapper>
    </Container>
  );
}
