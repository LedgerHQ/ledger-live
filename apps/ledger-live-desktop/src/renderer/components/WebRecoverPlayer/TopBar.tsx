import React, { RefObject, useCallback, useEffect, useRef, useMemo } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import styled from "styled-components";

import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";

import { rgba } from "~/renderer/styles/helpers";

import Box, { Tabbable } from "~/renderer/components/Box";

import LightBulb from "~/renderer/icons/LightBulb";
import IconReload from "~/renderer/icons/UpdateCircle";
import IconClose from "~/renderer/icons/Cross";
import IconInfoCircle from "~/renderer/icons/InfoCircle";

import { WebviewState, WebviewAPI } from "../Web3AppWebview/types";
import { openPlatformAppInfoDrawer } from "~/renderer/actions/UI";
import Spinner from "../Spinner";

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
  onClose: () => void;
};

export const TopBar = ({ manifest, webviewAPIRef, webviewState, onClose }: Props) => {
  const lastMatchingURL = useRef<string | null>(null);

  const dispatch = useDispatch();

  const isWhitelistedDomain = useMemo(() => {
    if (!lastMatchingURL || !webviewState.url) {
      return true;
    }

    const manifestHostname = new URL(manifest.url).hostname;
    const currentHostname = new URL(webviewState.url).hostname;

    return manifestHostname === currentHostname;
  }, [manifest.url, webviewState.url]);

  const onOpenDevTools = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.openDevTools();
  }, [webviewAPIRef]);

  const handleReload = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.reload();
  }, [webviewAPIRef]);

  const isLoading = useDebounce(webviewState.loading, 100);

  const onInfoClick = useCallback(() => {
    dispatch(openPlatformAppInfoDrawer({ manifest }));
  }, [manifest, dispatch]);

  useEffect(() => {
    if (isWhitelistedDomain) {
      lastMatchingURL.current = webviewState.url;
    }
  }, [isWhitelistedDomain, webviewState.url]);

  return (
    <Container>
      <RightContainer>
        <ItemContainer isInteractive onClick={onInfoClick}>
          <IconInfoCircle size={16} />
        </ItemContainer>

        <Separator />

        <ItemContainer isInteractive onClick={onOpenDevTools}>
          <LightBulb size={16} />
          <ItemContent>
            <Trans i18nKey="common.sync.devTools" />
          </ItemContent>
        </ItemContainer>

        <Separator />

        <ItemContainer isInteractive onClick={handleReload}>
          {!isLoading ? <IconReload size={16} /> : <Spinner isRotating size={16} />}
          <ItemContent>
            <Trans i18nKey="common.sync.refresh" />
          </ItemContent>
        </ItemContainer>

        <Separator />

        <ItemContainer isInteractive onClick={onClose}>
          <IconClose size={16} />
          <ItemContent>
            <Trans i18nKey="common.close" />
          </ItemContent>
        </ItemContainer>
      </RightContainer>
    </Container>
  );
};
