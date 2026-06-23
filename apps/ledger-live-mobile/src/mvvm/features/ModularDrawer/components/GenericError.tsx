import { Flex, Icons, Text, Button } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "styled-components/native";

type Props = { onClick?: () => void; type: "backend" | "internet" };

export const GenericError = ({ onClick, type }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Flex
      p={6}
      flexDirection="row"
      mx={16}
      style={{ borderRadius: 12, backgroundColor: colors.error.c70a02 }}
    >
      <Icons.DeleteCircleFill size="M" color={"error.c70"} />
      <Flex ml={3}>
        <Text mb={2} style={{ fontSize: 16, fontWeight: "600", color: colors.neutral.c100 }}>
          {t("modularDrawer.errors.title")}
        </Text>
        <Text mb={4} style={{ fontSize: 14, fontWeight: "500", color: colors.neutral.c100 }}>
          {t(`modularDrawer.errors.${type}`)}
        </Text>

        {onClick && (
          <Button type="error" onPress={onClick} alignSelf="flex-start">
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.constant.white }}>
              {t("modularDrawer.errors.cta")}
            </Text>
          </Button>
        )}
      </Flex>
    </Flex>
  );
};
