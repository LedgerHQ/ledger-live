import React from "react";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";

type Props = {
  onClose: () => void;
};

const DrawerHeader: React.FC<Props> = ({ onClose }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Flex
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      width="100%"
      pt={16}
      pl={16}
      pr={16}
    >
      <Flex flex={1} />
      <Text
        flex={3}
        fontSize={16}
        fontWeight="semiBold"
        color={colors.neutral.c100}
        textAlign="center"
      >
        {t("walletSync.synchronize.qrCode.title")}
      </Text>
      <Flex flex={1} alignItems="flex-end">
        <TouchableOpacity onPress={onClose}>
          <Flex
            justifyContent="center"
            alignItems="center"
            p={3}
            borderRadius={32}
            backgroundColor={colors.opacityDefault.c10}
          >
            <Icons.Close size={"XS"} color={colors.neutral.c100} />
          </Flex>
        </TouchableOpacity>
      </Flex>
    </Flex>
  );
};

export default DrawerHeader;
