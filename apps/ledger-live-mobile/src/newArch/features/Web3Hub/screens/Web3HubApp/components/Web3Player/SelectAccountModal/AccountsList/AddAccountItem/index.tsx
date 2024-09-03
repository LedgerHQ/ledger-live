import React from "react";
import { TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Flex, Text, Icons } from "@ledgerhq/native-ui";

export default function AddAccountItem({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <>
      <TouchableOpacity onPress={onPress}>
        <Flex pt={6} px={6} pb={3} flexDirection={"row"} alignItems={"center"}>
          <Flex
            backgroundColor={colors.grey}
            height={50}
            width={50}
            borderRadius={50}
            alignItems={"center"}
            justifyContent={"center"}
          >
            <Icons.Plus />
          </Flex>

          <Text flex={1} pl={4} variant="large" fontWeight="semiBold" numberOfLines={1}>
            {t("web3hub.app.selectAccountModal.addAccountItem.name")}
          </Text>
        </Flex>
      </TouchableOpacity>
    </>
  );
}
