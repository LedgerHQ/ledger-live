import React, { memo, useCallback } from "react";
import { FlatList } from "react-native";
import { Trans } from "react-i18next";
import { InstalledItem, State } from "@ledgerhq/live-common/apps/index";
import { App } from "@ledgerhq/types-live";
import styled from "styled-components/native";
import { Flex, Icons, Text, Button } from "@ledgerhq/native-ui";

import QueuedDrawer from "../../../components/QueuedDrawer";

import AppIcon from "../AppsList/AppIcon";
import ByteSize from "../../../components/ByteSize";

const keyExtractor = (item: App, index: number) => String(item.id) + index;

type Props = {
  isOpened?: boolean;
  apps: App[];
  installed: InstalledItem[];
  onClose: () => void;
  onConfirm: () => void;
  state: State;
};

const AppLine = styled(Flex).attrs({
  marginBottom: 16,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
})``;

const AppName = styled(Text).attrs({
  alignItems: "center",
  marginLeft: 6,
})``;

const AppVersion = styled(Text).attrs({
  marginRight: 6,
  paddingLeft: 2,
  paddingRight: 1,
  paddingTop: 1,
  borderWidth: 1,
  borderRadius: 4,
  alignItems: "center",
  justifyContent: "center",
})``;

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

const FlatListContainer = styled(FlatList).attrs({
  width: "100%",
  maxHeight: 250,
  marginBottom: 20,
})`` as unknown as typeof FlatList;

const UpdateAllModal = ({
  isOpened,
  onClose,
  onConfirm,
  apps,
  installed,
  state,
}: Props) => {
  const { deviceInfo } = state;

  const data = apps.map(app => ({
    ...app,
    installed: installed.find(({ name }) => name === app.name),
  }));

  const renderAppLine = useCallback(
    ({
      item: { name, bytes, version: appVersion, installed },
      item,
    }: {
      item: App & { installed: InstalledItem | null | undefined };
    }) => {
      const version = (installed && installed.version) || appVersion;

      return (
        <AppLine>
          <Flex
            flexDirection="row"
            alignItems="center"
            style={{ width: "60%" }}
          >
            <AppIcon size={32} radius={10} app={item} />
            <AppName
              color="neutral.c100"
              fontWeight="semiBold"
              variant="body"
              numberOfLines={1}
            >
              {name}
            </AppName>
          </Flex>
          <Flex
            flexDirection="row"
            justifyContent="space-between"
            style={{ width: "35%" }}
          >
            <AppVersion
              color="neutral.c80"
              fontWeight="semiBold"
              variant="tiny"
              numberOfLines={1}
              borderColor="neutral.c40"
            >
              {version}
            </AppVersion>
            <Text
              textAlign="right"
              color="neutral.c70"
              fontWeight="medium"
              variant="body"
              numberOfLines={1}
            >
              <ByteSize
                value={bytes}
                deviceModel={state.deviceModel}
                firmwareVersion={deviceInfo.version}
              />
            </Text>
          </Flex>
        </AppLine>
      );
    },
    [state.deviceModel, deviceInfo],
  );

  return (
    <QueuedDrawer isRequestingToBeOpened={!!isOpened} onClose={onClose}>
      <Flex alignItems="center">
        <IconContainer borderColor="neutral.c40">
          <Icons.RefreshMedium size={24} color="neutral.c100" />
        </IconContainer>
        <TextContainer>
          <ModalText color="neutral.c100" fontWeight="medium" variant="h2">
            <Trans i18nKey="manager.update.subtitle" />
          </ModalText>
        </TextContainer>
        <FlatListContainer
          data={data}
          renderItem={renderAppLine}
          keyExtractor={keyExtractor}
          bounces={false}
          scrollEnabled
          scrollEventThrottle={50}
          showsVerticalScrollIndicator={false}
        />
        <ButtonsContainer>
          <Button size="large" type="main" onPress={onConfirm}>
            <Trans i18nKey="manager.update.updateAll" />
          </Button>
        </ButtonsContainer>
      </Flex>
    </QueuedDrawer>
  );
};

export default memo(UpdateAllModal);
