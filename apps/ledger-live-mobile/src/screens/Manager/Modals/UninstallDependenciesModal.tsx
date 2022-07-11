import React, { memo, useCallback } from "react";
import { View } from "react-native";
import { Trans } from "react-i18next";

import { Action } from "@ledgerhq/live-common/apps/index";
import { App } from "@ledgerhq/live-common/types/manager";

import styled, { useTheme } from "styled-components/native";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import AppTree from "../../../icons/AppTree";
import AppIcon from "../AppsList/AppIcon";

import BottomModal from "../../../components/BottomModal";
import CollapsibleList from "../../../components/CollapsibleList";
import ListTreeLine from "../../../icons/ListTreeLine";

import getWindowDimensions from "../../../logic/getWindowDimensions";

const { height } = getWindowDimensions();

type Props = {
  appUninstallWithDependencies: { app: App; dependents: App[] };
  dispatch: (action: Action) => void;
  onClose: () => void;
};

const LIST_HEIGHT = height - 420;
const LINE_HEIGHT = 46;

const ImageContainer = styled(Flex).attrs({
  width: "100%",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "nowrap",
  marginVertical: 8,
  height: 90,
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

const UninstallDependenciesModal = ({
  appUninstallWithDependencies,
  dispatch,
  onClose,
}: Props) => {
  const { colors } = useTheme();
  const { app, dependents = [] } = appUninstallWithDependencies || {};
  const { name } = app || {};

  const unInstallApp = useCallback(() => {
    dispatch({ type: "uninstall", name });
    onClose();
  }, [dispatch, onClose, name]);

  const renderDepLine = useCallback(
    ({ item }: any) => (
      <Flex
        flexDirection="row"
        position="relative"
        pl="23px"
        alignItems="center"
        height={LINE_HEIGHT}
      >
        <Flex position="absolute" bottom="20px" left="0">
          <ListTreeLine color={colors.grey} />
        </Flex>
        <AppIcon app={item} size={22} />
        <Text variant="body" pl={5} fontWeight="semiBold">
          {item.name}
        </Text>
      </Flex>
    ),
    [colors.grey],
  );
  return (
    <BottomModal isOpened={!!app} onClose={onClose}>
      <Flex alignItems="center">
        {app && dependents.length && (
          <View style={{ width: "100%" }}>
            <ImageContainer>
              <AppTree
                size={160}
                color={colors.neutral.c40}
                icon={app.icon}
                app={app}
              />
            </ImageContainer>
            <TextContainer>
              <ModalText color="neutral.c100" fontWeight="medium" variant="h2">
                <Trans
                  i18nKey="AppAction.uninstall.dependency.title"
                  values={{ app: name }}
                />
              </ModalText>
              <ModalText
                color="neutral.c70"
                fontWeight="medium"
                variant="bodyLineHeight"
              >
                <Trans
                  i18nKey="AppAction.uninstall.dependency.description_two"
                  values={{ app: name }}
                />
              </ModalText>
            </TextContainer>
            <CollapsibleList
              title={<Trans i18nKey="AppAction.uninstall.dependency.showAll" />}
              data={[app, ...dependents]}
              renderItem={renderDepLine}
              itemHeight={LINE_HEIGHT}
              containerStyle={{
                maxHeight:
                  LIST_HEIGHT - (LIST_HEIGHT % LINE_HEIGHT) - LINE_HEIGHT / 2, // max height available but still cutting the list mid items for UX
              }}
            />
            <ButtonsContainer>
              <Button size="large" type="error" onPress={unInstallApp}>
                <Trans
                  i18nKey="AppAction.uninstall.continueUninstall"
                  values={{ app: name }}
                />
              </Button>
            </ButtonsContainer>
          </View>
        )}
      </Flex>
    </BottomModal>
  );
};

export default memo(UninstallDependenciesModal);
