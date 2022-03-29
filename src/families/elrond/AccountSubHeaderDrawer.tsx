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
      id="elrond-more-info-modal"
      isOpen={isOpen}
      onClose={onClose}
      title={t("elrond.account.subHeader.drawerTitle")}
      description={t("elrond.account.subHeader.title")}
    >
      <Box>
        <Text variant={"paragraph"} color={"neutral.c100"}>
          {t("elrond.account.subHeader.description")}
        </Text>
        <Text variant={"paragraph"} color={"neutral.c100"} mt={2}>
          {t("elrond.account.subHeader.description2")}
        </Text>
        <Text variant={"paragraph"} color={"neutral.c100"} mt={2}>
          {t("elrond.account.subHeader.description3")}
        </Text>
        <Flex alignItems={"flex-start"} mt={3}>
          <ExternalLink
            text={t("elrond.account.subHeader.website")}
            onPress={() => Linking.openURL(urls.elrond.website)}
            fontSize={14}
            event={"OpenElrondWebsite"}
          />
        </Flex>
      </Box>
    </BottomDrawer>
  );
}
