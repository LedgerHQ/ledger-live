import React, { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import BackButton from "./BackButton";

export default function AccountHeaderWrapper(onBackPress: () => void) {
  return function AccountHeader({ children }: PropsWithChildren) {
    const { t } = useTranslation();

    return (
      <>
        <Flex mt={6} mx={6} flexDirection={"row"}>
          <BackButton onPress={onBackPress} />
          <Flex flex={1} height={32} justifyContent={"center"}>
            <Text variant="h5">{t("web3hub.app.selectAccountModal.accountHeader.title")}</Text>
          </Flex>
          {children}
        </Flex>
        <Box height="1px" width="100%" backgroundColor={"translucentGrey"} />
      </>
    );
  };
}
