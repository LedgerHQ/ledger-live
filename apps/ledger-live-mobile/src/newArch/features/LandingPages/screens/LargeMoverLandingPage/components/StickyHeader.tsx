import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { NavigationHeaderCloseButtonAdvanced } from "~/components/NavigationHeaderCloseButton";
import { track } from "~/analytics";
import { PAGE_NAME } from "../const";

export const StickyHeader = () => {
  const { t } = useTranslation();
  const handleClose = () => {
    track("button_clicked", {
      button: "Close",
      page: PAGE_NAME,
    });
  };
  return (
    <Flex
      flexDirection="row"
      justifyContent="space-between"
      padding={2}
      backgroundColor="neutral.c00"
    >
      <Text fontSize={22} fontWeight="bold" color="neutral.c100" padding={6}>
        {t(`largeMover.title`)}
      </Text>
      <NavigationHeaderCloseButtonAdvanced onClose={handleClose} />
    </Flex>
  );
};
