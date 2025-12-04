import React, { useCallback } from "react";
import { Button } from "@ledgerhq/ldls-ui-react";
import { Flex } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { SettingsSectionRow as Row } from "../../SettingsSection";
import {
  CLSSupportedDeviceModelId,
  supportedDeviceModelIds,
} from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { setDrawer } from "~/renderer/drawers/Provider";
import CustomImage from "~/renderer/screens/customImage";
import { getDeviceModel } from "@ledgerhq/devices";

const CustomLockScreenTester = () => {
  const { t } = useTranslation();

  const onClickButton = useCallback((deviceModelId: CLSSupportedDeviceModelId) => {
    setDrawer(
      CustomImage,
      { deviceModelId, hasCustomLockScreen: false, setHasCustomLockScreen: () => {} },
      { forceDisableFocusTrap: true },
    );
  }, []);

  return (
    <>
      <Row
        title={t("settings.developer.customLockScreenTester")}
        desc={t("settings.developer.customLockScreenTesterDesc")}
      >
        <Flex columnGap={2}>
          {supportedDeviceModelIds.map(deviceModelId => (
            <Button
              size="sm"
              appearance="accent"
              onClick={() => onClickButton(deviceModelId)}
              key={deviceModelId}
            >
              {getDeviceModel(deviceModelId)?.productName}
            </Button>
          ))}
        </Flex>
      </Row>
    </>
  );
};

export default CustomLockScreenTester;
