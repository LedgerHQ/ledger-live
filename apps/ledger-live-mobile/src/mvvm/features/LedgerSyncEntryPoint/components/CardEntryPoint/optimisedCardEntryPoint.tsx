import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import Logo from "./assets/Logo";

type Props = Readonly<{
  onPress: () => void;
}>;

export default function OptimisedCardEntryPoint({ onPress }: Props) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity onPress={onPress}>
      <Flex
        flexDirection={"row"}
        alignItems={"center"}
        bg="opacityDefault.c05"
        p={4}
        borderRadius={12}
      >
        <Flex position="relative">
          <Logo />
          <Flex
            bg="error.c60"
            height={8}
            width={8}
            borderRadius={4}
            position="absolute"
            right={0}
            bottom={46}
          />
        </Flex>
        <Flex ml={4} flex={1}>
          <Text color="neutral.c100" variant="paragraph" fontSize={16} fontWeight="semiBold">
            {t("walletSync.banner.title")}
          </Text>
          <Text color="neutral.c70" variant="paragraph" fontSize={14} fontWeight="semiBold" mt={2}>
            {t("walletSync.banner.description")}
          </Text>
        </Flex>
        <Icons.ChevronRight size="M" color="neutral.c80" />
      </Flex>
    </TouchableOpacity>
  );
}
