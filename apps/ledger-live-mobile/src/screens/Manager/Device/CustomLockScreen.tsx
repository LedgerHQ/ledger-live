import React, { useState } from "react";
import { Flex, Icons, Link, Text } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/types-devices";
import { useTranslation } from "react-i18next";

import CustomImageBottomModal from "../../../components/CustomImage/CustomImageBottomModal";

const CustomLockScreen: React.FC<{ device: Device }> = ({ device }) => {
  const [isCustomImageOpen, setIsCustomImageOpen] = useState(false);

  const { t } = useTranslation();

  return (
    <Flex flex={1} flexDirection="row" alignItems="center">
      <Icons.BracketsMedium size={20} color="neutral.c80" />
      <Text ml={3} flex={1} variant="bodyLineHeight" color="neutral.c80">
        {t("customImage.customImage")}
      </Text>
      <Link
        onPress={() => setIsCustomImageOpen(true)}
        type="color"
        Icon={Icons.ChevronRightMedium}
      >
        {t("customImage.replace")}
      </Link>
      <CustomImageBottomModal
        device={device}
        isOpened={isCustomImageOpen}
        onClose={() => setIsCustomImageOpen(false)}
      />
    </Flex>
  );
};

export default CustomLockScreen;
