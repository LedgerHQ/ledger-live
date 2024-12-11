import React, { useState, useCallback, useMemo } from "react";
import { Linking } from "react-native";
import { Trans } from "react-i18next";

import { State } from "@ledgerhq/live-common/apps/index";
import { isLiveSupportedApp } from "@ledgerhq/live-common/apps/logic";

import styled from "styled-components/native";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import { App } from "@ledgerhq/types-live";
import { urls } from "~/utils/urls";

import { NavigatorName, ScreenName } from "~/const";

import AppIcon from "../AppsList/AppIcon";

import QueuedDrawer from "~/components/QueuedDrawer";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { MyLedgerNavigatorStackParamList } from "~/components/RootNavigator/types/MyLedgerNavigator";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

type NavigationProps = BaseComposite<
  StackNavigatorProps<MyLedgerNavigatorStackParamList, ScreenName.MyLedgerDevice>
>;

type Props = {
  state: State;
  navigation: NavigationProps["navigation"];
  disable: boolean;
};

const TextContainer = styled(Flex).attrs({
  marginTop: 4,
  marginBottom: 32,
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
})``;

const ModalText = styled(Text).attrs({
  textAlign: "center",
  marginTop: 16,
})``;

const ButtonsContainer = styled(Flex).attrs({
  marginTop: 24,
  width: "100%",
})``;

const InstallSuccessBar = ({ state, navigation, disable }: Props) => {
  const [hasBeenShown, setHasBeenShown] = useState(disable);
  const { installQueue, uninstallQueue, recentlyInstalledApps, appByName, installed } = state;
  const llmNetworkBasedAddAccountFlow = useFeature("llmNetworkBasedAddAccountFlow");
  const onAddAccount = useCallback(() => {
    if (llmNetworkBasedAddAccountFlow?.enabled)
      navigation.navigate(NavigatorName.AssetSelection, {
        params: {
          context: "addAccounts",
        },
      });
    else navigation.navigate(NavigatorName.AddAccounts);

    setHasBeenShown(true);
  }, [navigation, llmNetworkBasedAddAccountFlow?.enabled]);

  const successInstalls = useMemo(
    () =>
      !hasBeenShown && installQueue.length <= 0 && uninstallQueue.length <= 0
        ? recentlyInstalledApps
            .filter(appName => installed.some(({ name }) => name === appName))
            .map(name => appByName[name])
        : [],
    [
      appByName,
      hasBeenShown,
      installQueue.length,
      recentlyInstalledApps,
      uninstallQueue.length,
      installed,
    ],
  );

  const hasLiveSupported = useMemo(
    () => successInstalls.find(isLiveSupportedApp),
    [successInstalls],
  );

  const app: App | undefined = useMemo(
    () => (successInstalls && successInstalls.length > 0 && successInstalls[0]) || undefined,
    [successInstalls],
  );

  const onSupportLink = useCallback(() => {
    Linking.openURL(app?.supportURL || urls.appSupport);
    setHasBeenShown(true);
  }, [app]);

  const onClose = useCallback(() => setHasBeenShown(true), []);

  return (
    <QueuedDrawer isRequestingToBeOpened={successInstalls.length >= 1} onClose={onClose}>
      <Flex alignItems="center">
        {app && <AppIcon app={app} size={48} radius={14} />}
        <TextContainer>
          <ModalText color="neutral.c100" fontWeight="medium" variant="h2">
            <Trans i18nKey="AppAction.install.done.title" />
          </ModalText>
          <ModalText color="neutral.c70" fontWeight="medium" variant="body">
            {hasLiveSupported ? (
              <Trans i18nKey="AppAction.install.done.description" values={{ app: app?.name }} />
            ) : (
              <Trans i18nKey="manager.installSuccess.notSupported" />
            )}
          </ModalText>
        </TextContainer>
        <ButtonsContainer>
          {hasLiveSupported ? (
            <Button size="large" type="main" onPress={onAddAccount}>
              <Trans i18nKey="AppAction.install.done.accounts" />
            </Button>
          ) : (
            <Button size="large" type="main" onPress={onSupportLink}>
              <Trans i18nKey="manager.installSuccess.learnMore" />
            </Button>
          )}
        </ButtonsContainer>
      </Flex>
    </QueuedDrawer>
  );
};

export default InstallSuccessBar;
