import React from "react";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { InfoMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTheme } from "styled-components/native";
import QueuedDrawer from "~/components/QueuedDrawer";
import Circle from "~/components/Circle";

type Props = {
  onClose: () => void;
  isOpen: boolean;
};
export function NotCompatibleModal({ onClose, isOpen }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <QueuedDrawer isRequestingToBeOpened={!!isOpen} onClose={onClose} noCloseButton>
      <Flex alignItems="center" mt={6}>
        <Circle bg={colors.opacityDefault.c05} size={70}>
          <InfoMedium size={30} color={"primary.c80"} />
        </Circle>
      </Flex>

      <Flex alignItems="center" mt={7} testID="onboarding-deviceNotCompatible-modal">
        <Text variant="h4" fontWeight="semiBold" color="neutral.c100">
          {t("syncOnboarding.deviceSelection.modal.title")}
        </Text>
        <Text variant="bodyLineHeight" fontWeight="medium" color="neutral.c70" mt={6}>
          {t("syncOnboarding.deviceSelection.modal.desc")}
        </Text>
      </Flex>
      <Flex mx={16} flexDirection={"row"} mt={8}>
        <Button
          onPress={onClose}
          type="main"
          size={"large"}
          flex={1}
          testID="onboarding-deviceNotCompatible-close"
        >
          {t("common.close")}
        </Button>
      </Flex>
    </QueuedDrawer>
  );
}
