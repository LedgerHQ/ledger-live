import React from "react";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { BottomDrawer, Box, Flex, Text } from "@ledgerhq/native-ui";
import { urls } from "../../config/urls";
import ExternalLink from "../../components/ExternalLink";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AccountSubHeaderDrawer({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <BottomDrawer
      id="cryptoOrg-more-info-modal"
      isOpen={isOpen}
      onClose={onClose}
      title={t("cryptoOrg.account.subHeader.drawerTitle")}
      description={t("cryptoOrg.account.subHeader.title")}
    >
      <Box>
        <Text variant={"paragraph"} color={"neutral.c100"}>
          {t("cryptoOrg.account.subHeader.description")}
        </Text>
        <Text variant={"paragraph"} color={"neutral.c100"} mt={2}>
          {t("cryptoOrg.account.subHeader.description2")}
        </Text>
        <Flex alignItems={"flex-start"} mt={3}>
          <ExternalLink
            text={t("cryptoOrg.account.subHeader.website")}
            onPress={() => Linking.openURL(urls.cryptoOrg.website)}
            fontSize={14}
            event={"OpenCryptoOrgWebsite"}
          />
        </Flex>
      </Box>
    </BottomDrawer>
  );
}
