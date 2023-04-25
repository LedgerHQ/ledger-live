import React, { useCallback, useEffect, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import { Icons } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/types-devices";
import staxFetchImageHash from "@ledgerhq/live-common/hw/staxFetchImageHash";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";

import { from } from "rxjs";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { hasCompletedCustomImageFlowSelector } from "../../../reducers/settings";
import { NavigatorName, ScreenName } from "../../../const";
import CustomImageBottomModal from "../../../components/CustomImage/CustomImageBottomModal";
import DeviceOptionRow from "./DeviceOptionRow";

const CustomLockScreen: React.FC<{ device: Device }> = ({ device }) => {
  const navigation = useNavigation();
  const [isCustomImageOpen, setIsCustomImageOpen] = useState(false);
  const [deviceHasImage, setDeviceHasImage] = useState(false);
  const hasCompletedCustomImageFlow = useSelector(
    hasCompletedCustomImageFlowSelector,
  );

  const { t } = useTranslation();

  useEffect(() => {
    withDevice(device.deviceId)(transport =>
      from(staxFetchImageHash(transport)),
    )
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
        Icon={Icons.PhotographMedium}
        iconSize={20}
        label={t("customImage.title")}
        onPress={handleStartCustomImage}
        linkLabel={t(deviceHasImage ? "customImage.replace" : "common.add")}
      />
      <CustomImageBottomModal
        device={device}
        isOpened={isCustomImageOpen}
        onClose={() => setIsCustomImageOpen(false)}
      />
    </>
  );
};

export default CustomLockScreen;
