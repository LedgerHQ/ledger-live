import React from "react";
import styled from "styled-components";
import { Text } from "@ledgerhq/react-ui";
import { Trans } from "react-i18next";
import { DeviceInfo } from "@ledgerhq/types-live";
import { AppsDistribution } from "@ledgerhq/live-common/apps/index";
import { DeviceModel } from "@ledgerhq/devices";
import Box from "~/renderer/components/Box";
import ByteSize from "~/renderer/components/ByteSize";
import IconTriangleWarning from "~/renderer/icons/TriangleWarning";

type Props = {
  deviceModel: DeviceModel;
  distribution: AppsDistribution;
  deviceInfo: DeviceInfo;
  isIncomplete: boolean;
};

const Info = styled.div`
  font-family: Inter;
  display: flex;
  margin-bottom: 20px;
  font-size: 13px;
  line-height: 16px;

  & > div {
    display: flex;
    flex-direction: row;
    & > :nth-child(2) {
      margin-left: 10px;
    }
    margin-right: 30px;
  }
`;

const FreeInfo = styled.div<{ danger?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  color: ${p => (p.danger ? p.theme.colors.warning : p.theme.colors.palette.text.shade100)};
`;

/**
 * Component rendering a breakdown of information about the device storage:
 * used space, capacity, number of apps, free space.
 */
const StorageInfo: React.FC<Props> = ({ deviceModel, distribution, deviceInfo, isIncomplete }) => {
  const shouldWarn = distribution.shouldWarnMemory || isIncomplete;
  return (
    <Info>
      <div>
        <Text variant="h5Inter" fontSize={4} color="neutral.c70">
          <Trans i18nKey="manager.deviceStorage.used" />
        </Text>
        <Text variant="h5Inter" fontSize={4} color="neutral.c100" fontWeight="semiBold">
          <ByteSize
            deviceModel={deviceModel}
            value={distribution.totalAppsBytes}
            firmwareVersion={deviceInfo.version}
          />
        </Text>
      </div>
      <div>
        <Text variant="h5Inter" fontSize={4} color="neutral.c70">
          <Trans i18nKey="manager.deviceStorage.capacity" />
        </Text>
        <Text variant="h5Inter" fontSize={4} color="neutral.c100" fontWeight="semiBold">
          <ByteSize
            deviceModel={deviceModel}
            value={distribution.appsSpaceBytes}
            firmwareVersion={deviceInfo.version}
          />
        </Text>
      </div>
      <div>
        <Text variant="h5Inter" fontSize={4} color="neutral.c70">
          <Trans i18nKey="manager.deviceStorage.installed" />
        </Text>
        <Text variant="h5Inter" fontSize={4} color="neutral.c100" fontWeight="semiBold">
          {!isIncomplete ? distribution.apps.length : "—"}
        </Text>
      </div>
      <FreeInfo danger={shouldWarn}>
        {shouldWarn ? <IconTriangleWarning /> : ""}{" "}
        <Box paddingLeft={1}>
          <Text variant="h5Inter" fontSize={4} color="neutral.c100" fontWeight="semiBold">
            {isIncomplete ? (
              <Trans i18nKey="manager.deviceStorage.incomplete" />
            ) : distribution.freeSpaceBytes > 0 ? (
              <>
                <Trans
                  i18nKey="manager.deviceStorage.freeSpace"
                  values={{
                    space: 0,
                  }}
                >
                  <ByteSize
                    value={distribution.freeSpaceBytes}
                    deviceModel={deviceModel}
                    firmwareVersion={deviceInfo.version}
                  />
                  {"free"}
                </Trans>
              </>
            ) : (
              <Trans i18nKey="manager.deviceStorage.noFreeSpace" />
            )}
          </Text>
        </Box>
      </FreeInfo>
    </Info>
  );
};

export default React.memo(StorageInfo);
