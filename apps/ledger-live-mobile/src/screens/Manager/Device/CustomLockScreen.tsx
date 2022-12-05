import React, { useCallback, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Icons } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/types-devices";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { hasCompletedCustomImageFlowSelector } from "../../../reducers/settings";
import { NavigatorName, ScreenName } from "../../../const";

import CustomImageBottomModal from "../../../components/CustomImage/CustomImageBottomModal";
import DeviceOptionRow from "./DeviceOptionRow";

const CustomLockScreen: React.FC<{ device: Device }> = ({ device }) => {
  const navigation = useNavigation();
  const [isCustomImageOpen, setIsCustomImageOpen] = useState(false);
  const hasCompletedCustomImageFlow = useSelector(
    hasCompletedCustomImageFlowSelector,
  );

  const { t } = useTranslation();

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
        Icon={Icons.BracketsMedium}
        iconSize={20}
        label={t("customImage.customImage")}
        onPress={handleStartCustomImage}
        linkLabel={t("customImage.replace")}
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
