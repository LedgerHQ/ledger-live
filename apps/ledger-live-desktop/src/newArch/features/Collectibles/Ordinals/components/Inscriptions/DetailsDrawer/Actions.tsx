import React from "react";
import { t } from "i18next";
import { Flex, Icons, IconsLegacy, Text } from "@ledgerhq/react-ui";
import Button from "~/renderer/components/Button";

const Actions = () => (
  <Flex alignItems="center" columnGap={12}>
    <Button
      outlineGrey
      style={{ flex: 1, justifyContent: "center" }}
      my={4}
      onClick={() => {
        /* TODO */
      }}
      center
    >
      <Flex columnGap={1}>
        <Icons.Eye color="neutral.c100" />
        <Text variant="bodyLineHeight" fontWeight="600" fontSize={14} color="neutral.c100">
          {t("ordinals.inscriptions.detailsDrawer.hide")}
        </Text>
      </Flex>
    </Button>
    <Button outlineGrey>
      <IconsLegacy.OthersMedium />
    </Button>
  </Flex>
);

export default Actions;
