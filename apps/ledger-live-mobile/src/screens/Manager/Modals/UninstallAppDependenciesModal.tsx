import React, { memo, useCallback } from "react";
import { View } from "react-native";
import { Trans } from "react-i18next";
import { App } from "@ledgerhq/types-live";

import styled, { DefaultTheme, useTheme } from "styled-components/native";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import AppTree from "~/icons/AppTree";
import AppIcon from "../AppsList/AppIcon";

import QueuedDrawer from "~/components/QueuedDrawer";
import CollapsibleList from "~/components/CollapsibleList";
import ListTreeLine from "~/icons/ListTreeLine";

import getWindowDimensions from "~/logic/getWindowDimensions";
import { Theme } from "../../../colors";
import { AppWithDependents } from "../AppsInstallUninstallWithDependenciesContext";

const { height } = getWindowDimensions();

type Props = {
  appWithDependentsToUninstall: AppWithDependents | null;
  onClose: () => void;
  uninstallAppsWithDependents: () => void;
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

const UninstallAppDependenciesModal = ({
  appWithDependentsToUninstall,
  uninstallAppsWithDependents,
  onClose,
}: Props) => {
  const { colors } = useTheme() as DefaultTheme & Theme;
  const { app, dependents = [] } = appWithDependentsToUninstall || {};
  const { name } = app || {};

  const renderDepLine = useCallback(
    ({ item }: { item: App }) => (
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
    <QueuedDrawer isForcingToBeOpened={!!app} onClose={onClose}>
      <Flex alignItems="center">
        {app && dependents.length && (
          <View style={{ width: "100%" }}>
            <ImageContainer>
              <AppTree color={colors.neutral.c40} icon={app.icon} app={app} />
            </ImageContainer>
            <TextContainer>
              <ModalText color="neutral.c100" fontWeight="medium" variant="h2">
                <Trans i18nKey="AppAction.uninstall.dependency.title" values={{ app: name }} />
              </ModalText>
              <ModalText color="neutral.c70" fontWeight="medium" variant="bodyLineHeight">
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
                maxHeight: LIST_HEIGHT - (LIST_HEIGHT % LINE_HEIGHT) - LINE_HEIGHT / 2, // max height available but still cutting the list mid items for UX
              }}
            />
            <ButtonsContainer>
              <Button size="large" type="error" onPress={uninstallAppsWithDependents}>
                <Trans i18nKey="AppAction.uninstall.continueUninstall" values={{ app: name }} />
              </Button>
            </ButtonsContainer>
          </View>
        )}
      </Flex>
    </QueuedDrawer>
  );
};

export default memo(UninstallAppDependenciesModal);
