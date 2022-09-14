import React, { useState } from "react";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";

import Touchable from "../../../components/Touchable";
import CustomImageBottomModal from "../../../components/CustomImage/CustomImageBottomModal";

const CustomLockScreen: React.FC = () => {
  const [isCustomImageOpen, setIsCustomImageOpen] = useState(false);

  const { t } = useTranslation();

  return (
    <Flex
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
    >
      <Flex flexDirection="row">
        <Icons.CoffeeMedium size={24} color="neutral.c80" />
        <Text ml={2} variant="body" color="neutral.c80">
          {t("customImage.title")}
        </Text>
      </Flex>
      <Touchable onPress={() => setIsCustomImageOpen(true)}>
        <Flex flexDirection="row" alignItems="center" pr={2}>
          <Text variant="body" color="primary.c80" fontWeight="semiBold" mr={2}>
            {t("customImage.replace")}
          </Text>
          <Icons.ChevronRightMedium size={18} color="primary.c80" />
        </Flex>
      </Touchable>
      <CustomImageBottomModal
        isOpened={isCustomImageOpen}
        onClose={() => setIsCustomImageOpen(false)}
      />
    </Flex>
  );
};

export default CustomLockScreen;
