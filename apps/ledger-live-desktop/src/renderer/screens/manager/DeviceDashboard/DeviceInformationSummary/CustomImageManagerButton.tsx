import React, { useCallback } from "react";
import { Flex, IconsLegacy, Text, Link } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { setDrawer } from "~/renderer/drawers/Provider";
import CustomImage from "~/renderer/screens/customImage";
import ToolTip from "~/renderer/components/Tooltip";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

type Props = {
  disabled?: boolean;
  deviceModelId: CLSSupportedDeviceModelId;
  hasCustomLockScreen: boolean;
};

const CustomImageManagerButton = (props: Props) => {
  const { t } = useTranslation();
  const { disabled, deviceModelId, hasCustomLockScreen } = props;

  const onAdd = useCallback(() => {
    setDrawer(CustomImage, { deviceModelId, hasCustomLockScreen }, { forceDisableFocusTrap: true });
  }, [deviceModelId, hasCustomLockScreen]);

  return (
    <Flex flexDirection="row" columnGap={3} alignItems="center">
      <Text variant="h5Inter" fontSize={4} color="neutral.c70">
        {t("customImage.managerCTA")}
      </Text>
      <Link
        onClick={disabled ? undefined : onAdd}
        Icon={
          disabled
            ? props => (
                <ToolTip
                  content={
                    <Text color="neutral.c00" variant="small">
                      {t("appsInstallingDisabledTooltip")}
                    </Text>
                  }
                  placement="top"
                >
                  <IconsLegacy.InfoAltFillMedium {...props} />
                </ToolTip>
              )
            : IconsLegacy.ChevronRightMedium
        }
        disabled={disabled}
        data-testid="manager-custom-image-button"
      >
        {hasCustomLockScreen ? t("changeCustomLockscreen.cta") : t("common.add")}
      </Link>
    </Flex>
  );
};

export default withV3StyleProvider(CustomImageManagerButton);
