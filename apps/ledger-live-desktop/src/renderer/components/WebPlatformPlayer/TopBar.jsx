// @flow

import { WebviewTag } from "electron";
import React, { RefObject, useCallback, useEffect, useState } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";

import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

import { rgba } from "~/renderer/styles/helpers";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import type { TopBarConfig } from "./type";

import Box, { Tabbable } from "~/renderer/components/Box";

import ArrowRight from "~/renderer/icons/ArrowRight";
import IconClose from "~/renderer/icons/Cross";
import IconInfoCircle from "~/renderer/icons/InfoCircle";
import LightBulb from "~/renderer/icons/LightBulb";
import IconReload from "~/renderer/icons/UpdateCircle";

import { useDispatch, useSelector } from "react-redux";
import { enablePlatformDevToolsSelector } from "~/renderer/reducers/settings";
import LiveAppIcon from "./LiveAppIcon";

import { openPlatformAppInfoDrawer } from "~/renderer/actions/UI";

const Container: ThemedComponent<{}> = styled(Box).attrs(() => ({
  horizontal: true,
  grow: 0,
  alignItems: "center",
}))`
  padding: 10px 16px;
  background-color: ${p => p.theme.colors.palette.background.paper};
  border-bottom: 1px solid ${p => p.theme.colors.palette.text.shade10};
`;

const TitleContainer: ThemedComponent<{}> = styled(Box).attrs(() => ({
  horizontal: true,
  grow: 0,
  alignItems: "center",
  ff: "Inter|SemiBold",
}))`
  margin-right: 16px;
  color: ${p =>
    p.theme.colors.palette.type === "dark" ? p.theme.colors.white : p.theme.colors.black};

  > * + * {
    margin-left: 8px;
  }
`;

const RightContainer: ThemedComponent<{}> = styled(Box).attrs(() => ({
  horizontal: true,
  grow: 0,
  alignItems: "center",
  ml: "auto",
}))``;

const ItemContainer: ThemedComponent<{
  "data-e2e"?: string,
  isInteractive?: boolean,
  onClick?: () => void,
  disabled?: boolean,
  children: React$Node,
  justifyContent?: string,
}> = styled(Tabbable).attrs(p => ({
  padding: 1,
  alignItems: "center",
  cursor: p.disabled ? "not-allowed" : "default",
  horizontal: true,
  borderRadius: 1,
}))`
  -webkit-app-region: no-drag;
  height: 24px;
  position: relative;
  cursor: pointer;
  pointer-events: ${p => (p.disabled ? "none" : "unset")};

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

const ItemContent: ThemedComponent<{}> = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
}))`
  font-size: 14px;
  line-height: 20px;
`;

export const Separator: ThemedComponent<*> = styled.div`
  margin-right: 16px;
  height: 15px;
  width: 1px;
  background: ${p => p.theme.colors.palette.divider};
`;

export type Props = {
  icon?: boolean,
  manifest: LiveAppManifest,
  onReload: Function,
  onClose?: Function,
  onHelp?: Function,
  config?: TopBarConfig,
  webviewRef: RefObject<WebviewTag>,
};

const WebPlatformTopBar = ({
  manifest,
  onReload,
  onHelp,
  onClose,
  config = {},
  webviewRef,
}: Props) => {
  const { name, icon } = manifest;

  const {
    shouldDisplayName = true,
    shouldDisplayInfo = true,
    shouldDisplayClose = !!onClose,
    shouldDisplayNavigation = false,
  } = config;

  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const enablePlatformDevTools = useSelector(enablePlatformDevToolsSelector);
  const dispatch = useDispatch();

  const handleDidNavigate = useCallback(() => {
    const webview = webviewRef.current;

    if (webview) {
      setCanGoBack(webview.canGoBack());
      setCanGoForward(webview.canGoForward());
    }
  }, [webviewRef]);

  useEffect(() => {
    const webview = webviewRef.current;

    /**
     * Handle webview navigation events.
     * The two events are complementary to enccompass the webview's navigation
     *
     * `did-navigate` is emitted when a navigation is done. But this event is not
     * emitted for in-page navigations, such as clicking anchor links or updating
     * the window.location.hash.
     * That's why we use did-navigate-in-page event for this purpose.
     * cf. doc bellow:
     *
     * https://www.electronjs.org/docs/latest/api/webview-tag#event-did-navigate
     * https://www.electronjs.org/docs/latest/api/webview-tag#event-did-navigate-in-page
     */

    if (webview && shouldDisplayNavigation) {
      webview.addEventListener("did-navigate", handleDidNavigate);
      webview.addEventListener("did-navigate-in-page", handleDidNavigate);

      return () => {
        webview.removeEventListener("did-navigate", handleDidNavigate);
        webview.removeEventListener("did-navigate-in-page", handleDidNavigate);
      };
    }
  }, [handleDidNavigate, webviewRef, shouldDisplayNavigation]);

  const onClick = useCallback(() => {
    dispatch(openPlatformAppInfoDrawer({ manifest }));
  }, [manifest, dispatch]);

  const onOpenDevTools = useCallback(() => {
    const webview = webviewRef.current;
    if (webview) {
      webview.openDevTools();
    }
  }, [webviewRef]);

  const onGoBack = useCallback(() => {
    const webview = webviewRef.current;
    if (webview) {
      webview.goBack();
    }
  }, [webviewRef]);

  const onGoForward = useCallback(() => {
    const webview = webviewRef.current;
    if (webview) {
      webview.goForward();
    }
  }, [webviewRef]);

  return (
    <Container>
      {shouldDisplayName && (
        <>
          <TitleContainer>
            <LiveAppIcon name={name} icon={icon || undefined} size={20} />
            <ItemContent data-test-id="live-app-title">{name}</ItemContent>
          </TitleContainer>
          <Separator />
        </>
      )}
      <ItemContainer isInteractive onClick={onReload}>
        <IconReload size={16} />
        <ItemContent>
          <Trans i18nKey="common.sync.refresh" />
        </ItemContent>
      </ItemContainer>
      {shouldDisplayNavigation && (
        <>
          <ItemContainer disabled={!canGoBack} isInteractive onClick={onGoBack}>
            <ArrowRight flipped size={16} />
          </ItemContainer>
          <ItemContainer disabled={!canGoForward} isInteractive onClick={onGoForward}>
            <ArrowRight size={16} />
          </ItemContainer>
        </>
      )}
      {enablePlatformDevTools && (
        <>
          <Separator />
          <ItemContainer isInteractive onClick={onOpenDevTools}>
            <LightBulb size={16} />
            <ItemContent>
              <Trans i18nKey="common.sync.devTools" />
            </ItemContent>
          </ItemContainer>
        </>
      )}
      {(shouldDisplayInfo || shouldDisplayClose) && (
        <RightContainer>
          {shouldDisplayInfo && (
            <ItemContainer isInteractive onClick={onClick}>
              <IconInfoCircle size={16} />
            </ItemContainer>
          )}

          {shouldDisplayClose && (
            <ItemContainer isInteractive onClick={onClose}>
              <IconClose size={16} />
            </ItemContainer>
          )}
        </RightContainer>
      )}
    </Container>
  );
};

export default WebPlatformTopBar;
