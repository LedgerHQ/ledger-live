import React, { memo, useCallback } from "react";
import { FlatList } from "react-native";
import { Trans } from "react-i18next";
import { InstalledItem, State } from "@ledgerhq/live-common/apps/index";
import { App } from "@ledgerhq/types-live";
import styled from "styled-components/native";
import { Flex, IconsLegacy, Text, Button, Icons } from "@ledgerhq/native-ui";
import QueuedDrawer from "~/components/QueuedDrawer";
import AppIcon from "../AppsList/AppIcon";
import ByteSize from "~/components/ByteSize";

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
  width: 36,
  height: 18,
  paddingLeft: 2,
  paddingRight: 1,
  paddingTop: 1,
  textAlign: "center",
  borderRadius: 4,
})``;

const IconContainer = styled(Flex).attrs({
  padding: 16,
  borderRadius: 100,
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
  textTransform: "none",
  fontFamily: "Inter",
  fontSize: 24,
  lineHeight: "32",
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

export default memo(function ({ isOpened, onClose, onConfirm, apps, installed, state }: Props) {
  const { deviceInfo } = state;

  const data = apps.map(app => ({
    ...app,
    installed: installed.find(({ name }) => name === app.name),
  }));

  const renderAppLine = useCallback(
    function ({
      item: { name, bytes, version: appVersion, installed },
      item,
    }: {
      item: App & { installed: InstalledItem | null | undefined };
    }) {
      const { availableVersion: newVersion = appVersion, version: curVersion = appVersion } =
        installed ?? {};

      return (
        <AppLine>
          <Flex flexDirection="row" alignItems="center" style={{ width: "60%" }}>
            <AppIcon size={32} radius={10} app={item} />
            <AppName color="neutral.c100" fontWeight="semiBold" variant="body" numberOfLines={1}>
              {name}
            </AppName>
          </Flex>
          <Flex
            flexDirection="row"
            justifyContent="space-between"
            style={{ width: "40%" }}
            alignItems="center"
          >
            <AppVersion
              color="neutral.c80"
              fontWeight="semiBold"
              variant="tiny"
              numberOfLines={1}
              backgroundColor="neutral.c30"
            >
              {curVersion}
            </AppVersion>
            <IconsLegacy.ArrowRightMedium color="neutral.c80" />
            <AppVersion
              color="neutral.c80"
              fontWeight="semiBold"
              variant="tiny"
              numberOfLines={1}
              backgroundColor="neutral.c30"
            >
              {newVersion}
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
        <IconContainer backgroundColor="neutral.c30">
          <Icons.InformationFill size={"L"} color="primary.c80" />
        </IconContainer>
        <TextContainer>
          <ModalText color="neutral.c100" fontWeight="semiBold" variant="h4">
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
});
