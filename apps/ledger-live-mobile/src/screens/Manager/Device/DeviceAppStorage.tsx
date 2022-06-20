import React, { memo, useMemo } from "react";

import { Trans } from "react-i18next";

import { DeviceModel } from "@ledgerhq/devices";
import { AppsDistribution } from "@ledgerhq/live-common/apps/index";
import { DeviceInfo } from "@ledgerhq/live-common/types/manager";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { WarningMedium } from "@ledgerhq/native-ui/assets/icons";

import styled from "styled-components/native";
import ByteSize from "../../../components/ByteSize";

type Props = {
  deviceModel: DeviceModel;
  deviceInfo: DeviceInfo;
  distribution: AppsDistribution;
};

const StorageRepartition = styled(Box)`
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  flex-basis: 12px;
  height: 12px;
  overflow: hidden;
  border-radius: 30px;
  margin-bottom: 24px;
`;

const DeviceAppStorage = ({
  deviceModel,
  deviceInfo,
  distribution: { freeSpaceBytes, appsSpaceBytes, shouldWarnMemory, apps },
}: Props) => {
  const appSizes = useMemo(
    () =>
      apps.filter(Boolean).map(({ bytes, currency, name }) => ({
        name,
        ratio: Number((bytes / appsSpaceBytes) * 100).toFixed(2),
        color: (currency && currency.color) || "#000000",
      })),
    [apps, appsSpaceBytes],
  );

  return (
    /* Fixme: Storage info line might be too tight with some translation, consider putting it on multiple lines */
    <Box mx={6}>
      <Flex
        flexDirection={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
        flexWrap={"wrap"}
        mb={3}
      >
        <Flex flexDirection={"row"} alignItems={"center"}>
          <Text
            variant={"small"}
            fontWeight={"medium"}
            color={"palette.neutral.c100"}
            mr={3}
          >
            <Text
              variant={"small"}
              fontWeight={"medium"}
              color={"palette.neutral.c80"}
            >
              <Trans i18nKey="manager.storage.used" />
            </Text>{" "}
            <ByteSize
              value={appsSpaceBytes}
              deviceModel={deviceModel}
              firmwareVersion={deviceInfo.version}
            />
          </Text>
          <Text
            variant={"small"}
            fontWeight={"medium"}
            color={"palette.neutral.c80"}
          >
            <Trans
              count={apps.length}
              values={{ number: apps.length }}
              i18nKey="manager.storage.appsInstalled"
            >
              <Text
                variant={"small"}
                fontWeight={"medium"}
                color={"palette.neutral.c100"}
              >
                {"placeholder"}
              </Text>
              <Text
                variant={"small"}
                fontWeight={"medium"}
                color={"palette.neutral.c80"}
              >
                {"placeholder"}
              </Text>
            </Trans>
          </Text>
        </Flex>
        <Flex flexDirection={"row"} alignItems={"center"}>
          {shouldWarnMemory && (
            <Box mr={2}>
              <WarningMedium color={"palette.warning.c60"} size={14} />
            </Box>
          )}
          <Text
            variant={"small"}
            fontWeight={"medium"}
            color={"palette.neutral.c80"}
          >
            <ByteSize
              value={freeSpaceBytes}
              deviceModel={deviceModel}
              firmwareVersion={deviceInfo.version}
            />{" "}
            <Trans i18nKey="manager.storage.storageAvailable" />
          </Text>
        </Flex>
      </Flex>
      <StorageRepartition
        activeOpacity={1}
        bg="neutral.c40"
        style={{ flex: 1 }}
        event="ManagerAppDeviceGraphClick"
      >
        {appSizes.map(({ ratio, color, name }, i) => (
          <Box
            key={`${i}${name}`}
            backgroundColor={color}
            flexBasis={`${ratio}%`}
            flexShrink={1}
            flexGrow={0.005}
            height={"100%"}
          />
        ))}
      </StorageRepartition>
    </Box>
  );
};

export default memo(DeviceAppStorage);
