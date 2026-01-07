import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "~/context/hooks";
import { firstValueFrom, from } from "rxjs";

import { useNavigation } from "@react-navigation/native";
import { Icons, InfiniteLoader } from "@ledgerhq/native-ui";
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
import { importImageFromPhoneGallery } from "~/components/CustomImage/imageUtils";

const CustomLockScreen: React.FC<{
  device: Device;
  deviceModelId: CLSSupportedDeviceModelId;
  disabled: boolean;
}> = ({ device, deviceModelId, disabled }) => {
  const navigation = useNavigation();
  const [isCustomImageOpen, setIsCustomImageOpen] = useState(false);
  const [waitingForUserPicture, setWaitingForUserPicture] = useState(false);

  useEffect(() => {
    let dead = false;
    if (waitingForUserPicture) {
      importImageFromPhoneGallery().then(res => {
        if (dead) return;
        if (res !== null) {
          navigation.navigate(NavigatorName.CustomImage, {
            screen: ScreenName.CustomImagePreviewPreEdit,
            params: {
              ...res,
              device,
              deviceModelId,
            },
          });
        }
        setWaitingForUserPicture(false);
      });
    }
    return () => {
      dead = true;
    };
  }, [waitingForUserPicture, device, deviceModelId, navigation]);

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

  const handleStartCustomImage = useCallback(() => {
    const openModal = () => {
      setIsCustomImageOpen(true);
    };
    const navigateToStep0Welcome = () => {
      navigation.navigate(NavigatorName.CustomImage, {
        screen: ScreenName.CustomImageStep0Welcome,
        params: {
          device,
          deviceModelId,
          referral: HOOKS_TRACKING_LOCATIONS.myLedgerDashboard,
        },
      });
    };

    if (deviceHasImage) {
      openModal();
    } else if (hasCompletedCustomImageFlow) {
      setWaitingForUserPicture(true);
    } else {
      navigateToStep0Welcome();
    }
  }, [device, hasCompletedCustomImageFlow, navigation, deviceModelId, deviceHasImage]);

  return (
    <>
      <DeviceOptionRow
        Icon={Icons.PictureImage}
        label={t("customImage.title")}
        onPress={disabled || waitingForUserPicture ? undefined : handleStartCustomImage}
        right={waitingForUserPicture ? <InfiniteLoader size={16} /> : undefined}
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
