import React, { RefObject, useCallback, useEffect, useMemo } from "react";
import { useHistory, useLocation, useRouteMatch } from "react-router";
import { URLSearchParams } from "url";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { rgba } from "~/renderer/styles/helpers";
import Box, { Tabbable } from "~/renderer/components/Box";
import ArrowRight from "~/renderer/icons/ArrowRight";
import LightBulb from "~/renderer/icons/LightBulb";
import IconReload from "~/renderer/icons/UpdateCircle";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import { useSelector } from "react-redux";
import { enablePlatformDevToolsSelector } from "~/renderer/reducers/settings";
import { WebviewState, WebviewAPI } from "../Web3AppWebview/types";
import Spinner from "../Spinner";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
// import { track } from "~/renderer/analytics/segment";

const Container = styled(Box).attrs(() => ({
  horizontal: true,
  grow: 0,
  alignItems: "center",
}))`
  padding: 10px 16px;
  background-color: ${p => p.theme.colors.palette.background.paper};
  border-bottom: 1px solid ${p => p.theme.colors.palette.text.shade10};
`;

const ItemContainer = styled(Tabbable).attrs(p => ({
  padding: 1,
  alignItems: "center",
  cursor: p.disabled ? "not-allowed" : "default",
  horizontal: true,
  borderRadius: 1,
}))<{
  "data-e2e"?: string;
  isInteractive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  justifyContent?: string;
  hidden?: boolean;
}>`
  -webkit-app-region: no-drag;
  height: 24px;
  position: relative;
  cursor: ${p => (p.isInteractive ? "pointer" : "initial")};
  pointer-events: ${p => (p.disabled ? "none" : "unset")};
  user-select: none;
  transition: opacity ease-out 100ms;
  opacity: ${p => (p.hidden ? "0" : "1")};

  margin-right: 16px;
  &:last-child {
    margin-right: 0;
  }

  > * + * {
    margin-left: 8px;
  }

  &:hover {
    color: ${p => (p.disabled ? "" : p.theme.colors.palette.text.shade100)};
    background: ${p => (p.disabled ? "" : rgba(p.theme.colors.palette.action.active, 0.05))};
  }

  &:active {
    background: ${p => (p.disabled ? "" : rgba(p.theme.colors.palette.action.active, 0.1))};
  }
`;

const ItemContent = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
}))`
  font-size: 14px;
  line-height: 20px;
`;

export const Separator = styled.div`
  margin-right: 16px;
  height: 15px;
  width: 1px;
  background: ${p => p.theme.colors.palette.divider};
`;

const RightContainer = styled(Box).attrs(() => ({
  horizontal: true,
  grow: 0,
  alignItems: "center",
  ml: "auto",
}))``;

export type Props = {
  icon?: boolean;
  manifest: LiveAppManifest;
  webviewAPIRef: RefObject<WebviewAPI>;
  webviewState: WebviewState;
};

const INTERNAL_APP_IDS = ["multibuy"];

function safeUrl(url: string) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

export const TopBar = ({ manifest, webviewAPIRef, webviewState }: Props) => {
  const history = useHistory();
  const location = useLocation();
  const match = useRouteMatch();

  console.log(location);

  const isInternalApp = useMemo(() => {
    return INTERNAL_APP_IDS.includes(manifest.id);
  }, [manifest.id]);

  const enablePlatformDevTools = useSelector(enablePlatformDevToolsSelector);
  const onOpenDevTools = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.openDevTools();
  }, [webviewAPIRef]);

  const onBackToMatchingURL = useCallback(async () => {
    // track("button_clicked", {
    //   button: flowName === "compare_providers" ? "back to quote" : "back to liveapp",
    //   provider: currentHostname,
    //   flow: flowName,
    // });

    history.goBack();
  }, [history]);

  const handleReload = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.reload();
  }, [webviewAPIRef]);

  // We react to queryparams in the url
  useEffect(() => {
    if (isInternalApp && webviewState.url) {
      const url = safeUrl(webviewState.url);

      if (url) {
        const manifestId = url.searchParams.get("goToManifest");

        if (manifestId) {
          const params = url.searchParams.get("goToParams");
          let manifestParams = "";

          if (params) {
            try {
              manifestParams = new URLSearchParams({
                ...JSON.parse(params),
                previousContext: "yo",
              }).toString();
            } catch {
              // empty try/catch for json parse
            }
          }
          // ensure it matches the url that is passed by the backend else paypal may fail
          history.push(`${match.url}/${manifestId}?${manifestParams}`);
        }
      }
    }
  }, [history, isInternalApp, match.url, webviewState.url]);

  const isLoading = useDebounce(webviewState.loading, 100);

  return (
    <Container>
      {!isInternalApp ? (
        <ItemContainer isInteractive onClick={onBackToMatchingURL}>
          <ArrowRight flipped size={16} />
        </ItemContainer>
      ) : null}
      <ItemContainer isInteractive onClick={handleReload}>
        <IconReload size={16} />
        <ItemContent>
          <Trans i18nKey="common.sync.refresh" />
        </ItemContent>
      </ItemContainer>
      {enablePlatformDevTools ? (
        <>
          <Separator />
          <ItemContainer isInteractive onClick={onOpenDevTools}>
            <LightBulb size={16} />
            <ItemContent>
              <Trans i18nKey="common.sync.devTools" />
            </ItemContent>
          </ItemContainer>
        </>
      ) : null}
      <RightContainer>
        <ItemContainer hidden={!isLoading}>
          <Spinner isRotating size={16} data-test-id="web-ptx-player-topbar-activity-indicator" />
        </ItemContainer>
      </RightContainer>
    </Container>
  );
};
