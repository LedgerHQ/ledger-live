import React, { useMemo, memo, useCallback } from "react";
import { useNotEnoughMemoryToInstall } from "@ledgerhq/live-common/apps/react";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { App } from "@ledgerhq/types-live";
import { State, Action, InstalledItem } from "@ledgerhq/live-common/apps/types";
import { isAppAssociatedCurrencySupported } from "@ledgerhq/live-common/apps/filtering";
import styled from "styled-components";
import { Trans } from "react-i18next";

import ByteSize from "~/renderer/components/ByteSize";
import Text from "~/renderer/components/Text";
import Ellipsis from "~/renderer/components/Ellipsis";
import Box from "~/renderer/components/Box";
import IconCheckFull from "~/renderer/icons/CheckFull";
import IconInfoCircleFull from "~/renderer/icons/InfoCircleFull";
import AppActions from "./AppActions";
import AppIcon from "./AppIcon";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useFeature, useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import ToolTip from "~/renderer/components/Tooltip";

const AppRowContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  border-top: 1px solid ${p => p.theme.colors.palette.text.shade10};
  padding: 20px;
  font-size: 12px;
`;

const AppTitleAndSubtitleContainer = styled.div`
  flex: 1;
  flex-direction: column;
  padding: 0px 15px;
  max-height: 40px;
  min-width: 160px;
  & > * {
    display: block;
  }
`;

const AppTitleText = styled(Text).attrs({
  ff: "Inter|Bold",
  fontSize: 3,
  color: "palette.text.shade100",
})`
  flex-shrink: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AppSubtitleText = styled(Text).attrs({
  ff: "Inter|Regular",
  fontSize: 3,
  color: "palette.text.shade60",
})`
  flex-shrink: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const appInfoSeparatorString = " • ";

type Props = {
  optimisticState: State;
  state: State;
  app: App;
  installed: InstalledItem | undefined | null;
  appStoreView: boolean;
  onlyUpdate?: boolean;
  forceUninstall?: boolean;
  showActions?: boolean;
  dispatch: (a: Action) => void;
  setAppInstallDep?: (a: { app: App; dependencies: App[] }) => void;
  setAppUninstallDep?: (a: { dependents: App[]; app: App }) => void;
  addAccount?: (a: CryptoCurrency | undefined) => void;
};

const Item = ({
  optimisticState,
  state,
  app,
  installed,
  appStoreView,
  onlyUpdate,
  forceUninstall,
  showActions = true,
  dispatch,
  setAppInstallDep,
  setAppUninstallDep,
  addAccount,
}: Props) => {
  const { name, authorName } = app;
  const { deviceModel, deviceInfo } = state;
  const notEnoughMemoryToInstall = useNotEnoughMemoryToInstall(optimisticState, name);
  const currency = useMemo(
    () => (app.currencyId && getCryptoCurrencyById(app.currencyId)) || undefined,
    [app.currencyId],
  );
  const onAddAccount = useCallback(() => {
    if (addAccount) addAccount(currency);
  }, [addAccount, currency]);
  const version = (installed && installed.version) || app.version;
  const newVersion = installed && installed.availableVersion;
  const availableApp = useMemo(
    () => state.apps.find(({ name }) => name === app.name),
    [app.name, state.apps],
  );

  const { getFeature, isFeature } = useFeatureFlags();
  const isLiveSupported = isAppAssociatedCurrencySupported({ app, isFeature, getFeature });

  const bytes = useMemo(
    () =>
      (onlyUpdate && availableApp?.bytes) ||
      ((installed && installed.blocks) || 0) * deviceModel.getBlockSize(deviceInfo.version) ||
      app.bytes ||
      0,
    [app.bytes, availableApp?.bytes, deviceInfo.version, deviceModel, installed, onlyUpdate],
  );

  const { enabled: displayAppDeveloperName } = useFeature("myLedgerDisplayAppDeveloperName") || {};

  const appTitle = `${app.displayName}${currency ? ` (${currency.ticker})` : ""}`;

  const appSubtitle = (
    <>
      <Trans
        i18nKey="manager.applist.item.version"
        values={{
          version: onlyUpdate && newVersion && newVersion !== version ? newVersion : version,
        }}
      />
      {appInfoSeparatorString}
      {authorName && displayAppDeveloperName ? (
        <>
          {authorName}
          {appInfoSeparatorString}
        </>
      ) : null}
      <ByteSize value={bytes} deviceModel={deviceModel} firmwareVersion={deviceInfo.version} />
    </>
  );

  return (
    <AppRowContainer id={`managerAppsList-${name}`}>
      <Box flex="0.7" horizontal>
        <AppIcon app={app} />
        <ToolTip
          content={
            <>
              {appTitle}
              {appInfoSeparatorString}
              {appSubtitle}
            </>
          }
        >
          <AppTitleAndSubtitleContainer>
            <AppTitleText>{appTitle}</AppTitleText>
            <AppSubtitleText>{appSubtitle}</AppSubtitleText>
          </AppTitleAndSubtitleContainer>
        </ToolTip>
      </Box>
      <Box flex="0.7" horizontal alignContent="center" justifyContent="flex-start" ml={5}>
        {isLiveSupported ? (
          <>
            <Box>
              <IconCheckFull size={16} />
            </Box>
            <Ellipsis ml={2} ff="Inter|Regular" color="palette.text.shade60" fontSize={3}>
              <Trans i18nKey="manager.applist.item.supported" />
            </Ellipsis>
          </>
        ) : currency ? (
          <>
            <Box>
              <IconInfoCircleFull size={16} />
            </Box>
            <Ellipsis ml={2} ff="Inter|Regular" color="palette.text.shade60" fontSize={3}>
              <Trans i18nKey="manager.applist.item.not_supported" />
            </Ellipsis>
          </>
        ) : null}
      </Box>

      <AppActions
        state={state}
        app={app}
        installed={installed}
        dispatch={dispatch}
        forceUninstall={forceUninstall}
        appStoreView={appStoreView}
        onlyUpdate={onlyUpdate}
        showActions={showActions}
        notEnoughMemoryToInstall={notEnoughMemoryToInstall}
        setAppInstallDep={setAppInstallDep}
        setAppUninstallDep={setAppUninstallDep}
        isLiveSupported={isLiveSupported}
        addAccount={onAddAccount}
      />
    </AppRowContainer>
  );
};

export default memo<Props>(Item);
