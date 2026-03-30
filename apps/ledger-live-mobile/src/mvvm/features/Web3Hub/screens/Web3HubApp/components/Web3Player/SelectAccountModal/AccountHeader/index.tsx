import React from "react";
import { useTranslation } from "~/context/Locale";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { IconButton } from "@ledgerhq/lumen-ui-rnative";
import BackButton from "./BackButton";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";

export default function AccountHeaderWrapper(onBackPress: () => void, onClose: () => void) {
  return function AccountHeader() {
    const { t } = useTranslation();

    return (
      <>
        <Flex
          mt={6}
          mx={6}
          mb={6}
          flexDirection={"row"}
          justifyContent={"space-between"}
          alignItems={"center"}
        >
          <BackButton onPress={onBackPress} />
          <Text flex={1} variant="h5">
            {t("web3hub.app.selectAccountModal.accountHeader.title")}
          </Text>
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
      </>
    );
  };
}
