import React, { RefObject, useCallback } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { rgba } from "~/renderer/styles/helpers";
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
import { useSelectAccount } from "../Web3AppWebview/helpers";
import { WebviewAPI, WebviewState } from "../Web3AppWebview/types";
import Spinner from "../Spinner";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import { CurrentAccountHistDB, safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
import Wallet from "~/renderer/icons/Wallet";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import CryptoCurrencyIcon from "../CryptoCurrencyIcon";
import { walletSelector } from "~/renderer/reducers/wallet";
import { accountNameSelector } from "@ledgerhq/live-wallet/store";

const Container = styled(Box).attrs(() => ({
  horizontal: true,
  grow: 0,
  alignItems: "center",
}))`
  padding: 10px 16px;
  background-color: ${p => p.theme.colors?.palette.background.paper};
  border-bottom: 1px solid ${p => p.theme.colors?.palette.text.shade10};
`;

const TitleContainer = styled(Box).attrs(() => ({
  horizontal: true,
  grow: 0,
  alignItems: "center",
  ff: "Inter|SemiBold",
}))`
  margin-right: 16px;
  color: ${p =>
    p.theme.colors?.palette.type === "dark" ? p.theme.colors.white : p.theme.colors?.black};

  > * + * {
    margin-left: 8px;
  }
`;

const RightContainer = styled(Box).attrs(() => ({
  horizontal: true,
  grow: 0,
  alignItems: "center",
  ml: "auto",
}))``;

type ItemContainerProps = {
  "data-e2e"?: string;
  isInteractive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  justifyContent?: string;
  hidden?: boolean;
};

const ItemContainer = styled(Tabbable).attrs<ItemContainerProps>(p => ({
  padding: 1,
  alignItems: "center",
  cursor: p.disabled ? "not-allowed" : "default",
  horizontal: true,
  borderRadius: 1,
}))<ItemContainerProps>`
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
    color: ${p => (p.disabled ? "" : p.theme.colors?.palette.text.shade100)};
    background: ${p => (p.disabled ? "" : rgba(p.theme.colors?.palette.action.active, 0.05))};
  }

  &:active {
    background: ${p => (p.disabled ? "" : rgba(p.theme.colors?.palette.action.active, 0.1))};
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
  background: ${p => p.theme.colors?.palette.divider};
`;

export type TopBarConfig = {
  shouldDisplayName?: boolean;
  shouldDisplayInfo?: boolean;
  shouldDisplayClose?: boolean;
  shouldDisplayNavigation?: boolean;
  shouldDisplaySelectAccount?: boolean;
};

export type Props = {
  icon?: boolean;
  manifest: LiveAppManifest;
  onClose?: () => void;
  config?: TopBarConfig;
  webviewAPIRef: RefObject<WebviewAPI>;
  webviewState: WebviewState;
  currentAccountHistDb?: CurrentAccountHistDB;
};

export const TopBar = ({
  manifest,
  currentAccountHistDb,
  onClose,
  config = {},
  webviewAPIRef,
  webviewState,
}: Props) => {
  const walletState = useSelector(walletSelector);

  const { name, icon, id } = manifest;

  const {
    shouldDisplayName = true,
    shouldDisplayInfo = true,
    shouldDisplayClose = !!onClose,
    shouldDisplayNavigation = !!manifest.dapp,
    shouldDisplaySelectAccount = !!manifest.dapp,
  } = config;

  const isInternalApp = id === "earn";

  const enablePlatformDevTools = useSelector(enablePlatformDevToolsSelector);
  const dispatch = useDispatch();

  const handleReload = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.reload();
  }, [webviewAPIRef]);

  const onClick = useCallback(() => {
    dispatch(openPlatformAppInfoDrawer({ manifest }));
  }, [manifest, dispatch]);

  const onOpenDevTools = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.openDevTools();
  }, [webviewAPIRef]);

  const onGoBack = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.goBack();
  }, [webviewAPIRef]);

  const onGoForward = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.goForward();
  }, [webviewAPIRef]);

  const { onSelectAccount, currentAccount } = useSelectAccount({ manifest, currentAccountHistDb });
  const currentAccountName =
    currentAccount &&
    (accountNameSelector(walletState, { accountId: currentAccount.id }) ||
      getDefaultAccountName(currentAccount));

  const isLoading = useDebounce(webviewState.loading, 100);

  if (!enablePlatformDevTools && isInternalApp) {
    return null;
  }

  return (
    <Container>
      {shouldDisplayName ? (
        <>
          <TitleContainer>
            <LiveAppIcon name={name} icon={icon || undefined} size={20} />
            <ItemContent data-testid="live-app-title">{name}</ItemContent>
          </TitleContainer>
          <Separator />
        </>
      ) : null}
      <ItemContainer isInteractive onClick={handleReload}>
        <IconReload size={16} />
        <ItemContent>
          <Trans i18nKey="common.sync.refresh" />
        </ItemContent>
      </ItemContainer>
      {shouldDisplayNavigation ? (
        <>
          <ItemContainer disabled={!webviewState.canGoBack} isInteractive onClick={onGoBack}>
            <ArrowRight flipped size={16} />
          </ItemContainer>
          <ItemContainer disabled={!webviewState.canGoForward} isInteractive onClick={onGoForward}>
            <ArrowRight size={16} />
          </ItemContainer>
        </>
      ) : null}
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
          <Spinner
            isRotating
            size={16}
            data-testid="web-platform-player-topbar-activity-indicator"
          />
        </ItemContainer>
        {shouldDisplaySelectAccount ? (
          <>
            <ItemContainer
              isInteractive
              onClick={onSelectAccount}
              data-testid="web-platform-player-topbar-selected-account"
            >
              {!currentAccount ? (
                <>
                  <Wallet size={16} />
                  <ItemContent>
                    <Trans i18nKey="common.selectAccount" />
                  </ItemContent>
                </>
              ) : (
                <>
                  <CryptoCurrencyIcon
                    circle
                    currency={getAccountCurrency(currentAccount)}
                    size={16}
                  />
                  <ItemContent>{currentAccountName}</ItemContent>
                </>
              )}
            </ItemContainer>
            <Separator />
          </>
        ) : null}
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
    </Container>
  );
};
