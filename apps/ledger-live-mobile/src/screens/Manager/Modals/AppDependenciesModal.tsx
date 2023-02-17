import React, { memo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";

import { Action } from "@ledgerhq/live-common/apps/index";
import { App } from "@ledgerhq/types-live";

import styled from "styled-components/native";
import { Flex, Icons, Text, Button } from "@ledgerhq/native-ui";
import { hasInstalledAnyAppSelector } from "../../../reducers/settings";
import { installAppFirstTime } from "../../../actions/settings";
import AppIcon from "../AppsList/AppIcon";
import QueuedDrawer from "../../../components/QueuedDrawer";

type Props = {
  appInstallWithDependencies: { app: App; dependencies: App[] };
  dispatch: (_: Action) => void;
  onClose: () => void;
};

const IconContainer = styled(Flex).attrs({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
})``;

const LinkIconContainer = styled(Flex).attrs({
  width: 32,
  height: 32,
  borderRadius: 16,
  alignItems: "center",
  justifyContent: "center",
})``;

const TextContainer = styled(Flex).attrs({
  marginTop: "24px",
  marginBottom: "32px",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
})``;

const ModalText = styled(Text).attrs({
  textAlign: "center",
})``;

const SeparatorText = styled(Text).attrs({
  marginHorizontal: 6,
})``;

const ButtonsContainer = styled(Flex).attrs({
  width: "100%",
})``;

const CancelButton = styled(TouchableOpacity)`
  align-items: center;
  justify-content: center;
  margin-top: 25;
`;

function AppDependenciesModal({
  appInstallWithDependencies,
  dispatch: dispatchProps,
  onClose,
}: Props) {
  const dispatch = useDispatch();
  const hasInstalledAnyApp = useSelector(hasInstalledAnyAppSelector);

  const { app, dependencies = [] } = appInstallWithDependencies || {};
  const { name } = app || {};

  const installAppDependencies = useCallback(() => {
    if (!hasInstalledAnyApp) {
      dispatch(installAppFirstTime(true));
    }
    dispatchProps({ type: "install", name });
    onClose();
  }, [dispatch, dispatchProps, onClose, name, hasInstalledAnyApp]);

  return (
    <QueuedDrawer isRequestingToBeOpened={!!app} onClose={onClose}>
      <Flex alignItems="center">
        {!!dependencies.length && (
          <>
            <IconContainer>
              <AppIcon app={app} size={40} />
              <SeparatorText color="neutral.c40">- - -</SeparatorText>
              <LinkIconContainer backgroundColor="neutral.c30">
                <Icons.LinkMedium size={16} color="neutral.c80" />
              </LinkIconContainer>
              <SeparatorText color="neutral.c40">- - -</SeparatorText>
              <AppIcon app={dependencies[0]} size={40} />
            </IconContainer>
            <TextContainer>
              <ModalText color="neutral.c100" fontWeight="medium" variant="h2">
                <Trans
                  i18nKey="AppAction.install.dependency.title"
                  values={{ dependency: dependencies[0].name }}
                />
              </ModalText>
              <ModalText
                marginTop="16px"
                color="neutral.c70"
                fontWeight="medium"
                variant="bodyLineHeight"
              >
                <Trans
                  i18nKey="AppAction.install.dependency.description_one"
                  values={{ dependency: dependencies[0].name, app: name }}
                />
              </ModalText>
            </TextContainer>
            <ButtonsContainer>
              <Button size="large" type="main" onPress={installAppDependencies}>
                <Trans i18nKey="AppAction.install.continueInstall" />
              </Button>
              <CancelButton onPress={onClose}>
                <Text
                  variant="large"
                  fontWeight="semiBold"
                  color="neutral.c100"
                >
                  <Trans i18nKey="common.cancel" />
                </Text>
              </CancelButton>
            </ButtonsContainer>
          </>
        )}
      </Flex>
    </QueuedDrawer>
  );
}

export default memo(AppDependenciesModal);
