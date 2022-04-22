import React, { memo, useCallback, useMemo } from "react";
import { TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";

import type { State } from "@ledgerhq/live-common/lib/apps";

import { isLiveSupportedApp } from "@ledgerhq/live-common/lib/apps/logic";
import styled from "styled-components/native";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import { NavigatorName } from "../../../const";

import AppIcon from "../AppsList/AppIcon";

import ActionModal from "./ActionModal";


type Props = {
  state: State,
  navigation: any,
  onClose: () => void,
};

const IconContainer = styled(Flex).attrs({
  marginVertical: 20,
  padding: 22,
  borderWidth: 1,
  borderRadius: 8,
})``;

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

const CancelButton = styled(TouchableOpacity)`
  align-items: center;
  justify-content: center;
  margin-top: 25;
`;

function AppInstalledModal({
  state,
  navigation,
  onClose,
}: Props) {
  const {
    installQueue,
    uninstallQueue,
    recentlyInstalledApps,
    appByName,
    installed,
  } = state;

  const onAddAccount = useCallback(() => {
    navigation.navigate(NavigatorName.AddAccounts);
    onClose();
  }, [navigation, onClose]);

  const successInstalls = useMemo(
    () =>
      installQueue.length <= 0 && uninstallQueue.length <= 0
        ? recentlyInstalledApps
            .filter(appName => installed.some(({ name }) => name === appName))
            .map(name => appByName[name])
        : [],
    [
      appByName,
      installQueue.length,
      recentlyInstalledApps,
      uninstallQueue.length,
      installed,
    ],
  );

 return (
  <ActionModal isOpened={successInstalls && successInstalls.length > 0} onClose={onClose} actions={[]}>
    <IconContainer borderColor="neutral.c40">
      <AppIcon app={successInstalls[0]} size={48} radius={14} />
    </IconContainer>
    <TextContainer>
      <ModalText
        color="neutral.c100"
        fontWeight="medium"
        variant="h2"
      >
        <Trans
          i18nKey="AppAction.install.done.title"
        />
      </ModalText>
      <ModalText
        color="neutral.c70"
        fontWeight="medium"
        variant="body"
      >
        <Trans
          i18nKey="AppAction.install.done.description"
          values={{ app: successInstalls[0].name }}
        />
      </ModalText>
    </TextContainer>
    <ButtonsContainer>
      <Button size="large" type="main" onPress={onAddAccount}>
        <Trans i18nKey="AppAction.install.done.accounts" />
      </Button>
      <CancelButton onPress={onClose}>
        <Text variant="large" fontWeight="semiBold" color="neutral.c100">
          <Trans i18nKey="common.cancel" />
        </Text>
      </CancelButton>
    </ButtonsContainer>
  </ActionModal>
 );
}

export default memo(AppInstalledModal);
