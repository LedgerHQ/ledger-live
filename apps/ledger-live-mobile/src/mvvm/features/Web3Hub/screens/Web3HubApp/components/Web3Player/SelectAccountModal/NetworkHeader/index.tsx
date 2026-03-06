import React from "react";
import { useTranslation } from "~/context/Locale";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { IconButton } from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";

export default function NetworkHeaderWrapper(onClose: () => void) {
  return function NetworkHeader() {
    const { t } = useTranslation();

    return (
      <Box width="100%">
        <Flex
          mt={6}
          mb={6}
          mx={6}
          flexDirection={"row"}
          justifyContent={"space-between"}
          alignItems={"center"}
        >
          <Text variant="h5">{t("web3hub.app.selectAccountModal.networkHeader.title")}</Text>
          <IconButton
            appearance="transparent"
            style={{ borderRadius: 999 }}
            size="sm"
            icon={Close}
            accessibilityLabel="Close"
            onPress={onClose}
          />
        </Flex>
        <Box height="1px" width="100%" backgroundColor={"translucentGrey"} />
      </Box>
    );
  };
}
