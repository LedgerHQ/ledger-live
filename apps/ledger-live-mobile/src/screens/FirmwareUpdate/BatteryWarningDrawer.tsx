import React from "react";
import QueuedDrawer, { Props as QueuedDrawerProps } from "~/components/QueuedDrawer";
import { Button, Flex, IconBadge, IconsLegacy, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { GetBatteryStatusesActionState } from "@ledgerhq/live-common/deviceSDK/actions/getBatteryStatuses";
import { Device } from "@ledgerhq/types-devices";

type Props = QueuedDrawerProps & {
  state: GetBatteryStatusesActionState;
  lowBatteryPercentage: number;
  device: Device;
  onRetry: () => void;
  onQuit: () => void;
};

const BatteryWarningDrawer: React.FC<Props> = ({
  device,
  state,
  lowBatteryPercentage,
  onRetry,
  onQuit,
  ...props
}) => {
  const { t } = useTranslation();

  return (
    <>
      <QueuedDrawer noCloseButton {...props}>
        <Flex>
          <Flex alignItems="center" justifyContent="center" mb={8}>
            <IconBadge
              iconColor="primary.c100"
              iconSize={32}
              Icon={IconsLegacy.BatteryHalfMedium}
            />
            <Text fontSize={7} fontWeight="semiBold" textAlign="center" mt={6}>
              {t("FirmwareUpdate.staxBatteryLow")}
            </Text>
            <Text fontSize={4} textAlign="center" color="neutral.c80" mt={6}>
              {t("FirmwareUpdate.staxBatteryLowDescription", {
                lowBatteryPercentage,
              })}
            </Text>
          </Flex>

          <Button type="main" outline={false} onPress={onRetry} mt={6} alignSelf="stretch">
            {t("FirmwareUpdate.retryBatteryCheck")}
          </Button>
          <Button type="default" outline={false} onPress={onQuit} mt={6}>
            {t("FirmwareUpdate.quitUpdate")}
          </Button>
        </Flex>
      </QueuedDrawer>
    </>
  );
};

export default BatteryWarningDrawer;
