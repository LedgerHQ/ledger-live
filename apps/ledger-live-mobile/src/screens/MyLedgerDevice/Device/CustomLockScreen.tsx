import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { firstValueFrom, from } from "rxjs";

import { useNavigation } from "@react-navigation/native";
import { Icons } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/types-devices";
import customLockScreenFetchHash from "@ledgerhq/live-common/hw/customLockScreenFetchHash";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";

import {
  hasCompletedCustomImageFlowSelector,
  lastSeenCustomImageSelector,
} from "~/reducers/settings";
import { NavigatorName, ScreenName } from "~/const";
import CustomImageBottomModal from "~/components/CustomImage/CustomImageBottomModal";
import DeviceOptionRow from "./DeviceOptionRow";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";

const CustomLockScreen: React.FC<{
  device: Device;
  deviceModelId: CLSSupportedDeviceModelId;
  disabled: boolean;
}> = ({ device, deviceModelId, disabled }) => {
  const navigation = useNavigation();
  const [isCustomImageOpen, setIsCustomImageOpen] = useState(false);
  const [deviceHasImage, setDeviceHasImage] = useState(false);
  const lastSeenCustomImage = useSelector(lastSeenCustomImageSelector);

  const hasCompletedCustomImageFlow = useSelector(hasCompletedCustomImageFlowSelector);

  const { t } = useTranslation();

  useEffect(() => {
    setDeviceHasImage(!!lastSeenCustomImage);
  }, [lastSeenCustomImage]);

  useEffect(() => {
    firstValueFrom(
      withDevice(device.deviceId)(transport => from(customLockScreenFetchHash(transport))),
    ).then(hash => {
      setDeviceHasImage(hash !== "");
    });
  }, [device.deviceId]);

  const handleStartCustomImage = useCallback(
    () =>
      hasCompletedCustomImageFlow
        ? setIsCustomImageOpen(true)
        : navigation.navigate(NavigatorName.CustomImage, {
            screen: ScreenName.CustomImageStep0Welcome,
            params: {
              device,
              deviceModelId,
              referral: HOOKS_TRACKING_LOCATIONS.myLedgerDashboard,
            },
          }),
    [device, hasCompletedCustomImageFlow, navigation, deviceModelId],
  );

  return (
    <>
      <DeviceOptionRow
        Icon={Icons.PictureImage}
        label={t("customImage.title")}
        onPress={disabled ? undefined : handleStartCustomImage}
        linkLabel={t(deviceHasImage ? "customImage.change" : "common.add")}
      />
      <CustomImageBottomModal
        device={device}
        deviceModelId={deviceModelId}
        deviceHasImage={deviceHasImage}
        isOpened={isCustomImageOpen}
        setDeviceHasImage={setDeviceHasImage}
        onClose={() => setIsCustomImageOpen(false)}
      />
    </>
  );
};

export default CustomLockScreen;
