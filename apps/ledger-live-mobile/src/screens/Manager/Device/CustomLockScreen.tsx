import React, { useCallback, useEffect, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/types-devices";
import staxFetchImageHash from "@ledgerhq/live-common/hw/staxFetchImageHash";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";

import { from } from "rxjs";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import {
  hasCompletedCustomImageFlowSelector,
  lastSeenCustomImageSelector,
} from "../../../reducers/settings";
import { NavigatorName, ScreenName } from "../../../const";
import CustomImageBottomModal from "../../../components/CustomImage/CustomImageBottomModal";
import DeviceOptionRow from "./DeviceOptionRow";

const CustomLockScreen: React.FC<{ device: Device; disabled: boolean }> = ({
  device,
  disabled,
}) => {
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
    withDevice(device.deviceId)(transport => from(staxFetchImageHash(transport)))
      .toPromise()
      .then(hash => {
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
            },
          }),
    [device, hasCompletedCustomImageFlow, navigation],
  );

  return (
    <>
      <DeviceOptionRow
        Icon={IconsLegacy.PhotographMedium}
        iconSize={20}
        label={t("customImage.title")}
        onPress={disabled ? undefined : handleStartCustomImage}
        linkLabel={t(deviceHasImage ? "customImage.replace" : "common.add")}
      />
      <CustomImageBottomModal
        device={device}
        deviceHasImage={deviceHasImage}
        isOpened={isCustomImageOpen}
        setDeviceHasImage={setDeviceHasImage}
        onClose={() => setIsCustomImageOpen(false)}
      />
    </>
  );
};

export default CustomLockScreen;
