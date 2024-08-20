import React from "react";

import { Flex, Icons, rgba, Text } from "@ledgerhq/native-ui";
import { TouchableOpacity } from "react-native";
import styled, { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";

type Props = {
  onClickDelete: () => void;
};

export function ManageKey({ onClickDelete }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Flex pb={4}>
      <Text variant="h5" fontWeight="semiBold" color="neutral.c100" mb={4}>
        {t("walletSync.walletSyncActivated.manageKey.drawer.step1.title")}
      </Text>
      <Card onPress={onClickDelete}>
        <Flex
          flexDirection="row"
          bg="opacityDefault.c05"
          borderRadius={12}
          p={6}
          alignItems="center"
        >
          <Flex
            bg={rgba(colors.error.c50, 0.05)}
            width={40}
            height={40}
            borderRadius={8}
            alignItems="center"
            justifyContent="center"
          >
            <Icons.Trash size="M" color={"error.c50"} />
          </Flex>
          <Flex flexDirection="column" ml={3}>
            <Text variant="paragraph" fontWeight="semiBold" color="neutral.c100">
              {t("walletSync.walletSyncActivated.manageKey.drawer.step1.titleCta")}
            </Text>
            <Text variant="small" fontWeight="medium" color="neutral.c70">
              {t("walletSync.walletSyncActivated.manageKey.drawer.step1.descCta")}
            </Text>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
}

const Card = styled(TouchableOpacity)``;
