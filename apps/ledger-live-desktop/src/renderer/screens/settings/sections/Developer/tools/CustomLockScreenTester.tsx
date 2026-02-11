import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  CLSSupportedDeviceModelId,
  supportedDeviceModelIds,
} from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { setDrawer } from "~/renderer/drawers/Provider";
import CustomImage from "~/renderer/screens/customImage";
import { getDeviceModel } from "@ledgerhq/devices";
import DeveloperActionsRow from "../components/DeveloperActionsRow";

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
    <DeveloperActionsRow
      title={t("settings.developer.customLockScreenTester")}
      desc={t("settings.developer.customLockScreenTesterDesc")}
      actions={supportedDeviceModelIds.map(deviceModelId => ({
        key: deviceModelId,
        label: getDeviceModel(deviceModelId)?.productName || deviceModelId,
        onClick: () => onClickButton(deviceModelId),
      }))}
    />
  );
};

export default CustomLockScreenTester;
