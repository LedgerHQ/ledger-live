import React from "react";
import { useTranslation } from "react-i18next";
import { BottomDrawer, Box, Text } from "@ledgerhq/native-ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  family: string;
  team: string;
};

export default function AccountSubHeaderDrawer({
  isOpen,
  onClose,
  family,
  team,
}: Props) {
  const { t } = useTranslation();
  return (
    <BottomDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={t("account.subHeader.drawer.title", { family })}
      description={t("account.subHeader.drawer.subTitle", { family, team })}
    >
      <Box>
        <Text variant={"paragraph"} color={"neutral.c100"}>
          {t("account.subHeader.drawer.description")}
        </Text>
        <Text variant={"paragraph"} color={"neutral.c100"} mt={2}>
          {t("account.subHeader.drawer.description2")}
        </Text>
        <Text variant={"paragraph"} color={"neutral.c100"} mt={2}>
          {t("account.subHeader.drawer.description3", { team })}
        </Text>
      </Box>
    </BottomDrawer>
  );
}
