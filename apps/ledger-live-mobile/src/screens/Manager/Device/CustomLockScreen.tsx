import React, { useState } from "react";
import { Icons } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/types-devices";
import { useTranslation } from "react-i18next";

import CustomImageBottomModal from "../../../components/CustomImage/CustomImageBottomModal";
import DeviceOptionRow from "./DeviceOptionRow";

const CustomLockScreen: React.FC<{ device: Device }> = ({ device }) => {
  const [isCustomImageOpen, setIsCustomImageOpen] = useState(false);

  const { t } = useTranslation();

  return (
    <>
      <DeviceOptionRow
        Icon={Icons.BracketsMedium}
        iconSize={20}
        label={t("customImage.customImage")}
        onPress={() => setIsCustomImageOpen(true)}
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
