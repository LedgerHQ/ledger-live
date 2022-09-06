/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Link, Text } from "@ledgerhq/native-ui";
import { InfoMedium } from "@ledgerhq/native-ui/assets/icons";
import AccountSubHeaderDrawer from "./AccountSubHeaderDrawer";

type Props = {
  family: string;
  team: string;
};

function AccountSubHeader({ team, family }: Props) {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const { t } = useTranslation();

  function openDrawer() {
    setIsDrawerOpen(true);
  }

  function closeDrawer() {
    setIsDrawerOpen(false);
  }

  return (
    <Flex
      flexDirection={"row"}
      justifyContent={"space-between"}
      borderRadius={2}
      borderWidth={"1px"}
      borderColor={"neutral.c40"}
      p={6}
      m={6}
    >
      <Text variant={"large"} color={"neutral.c90"} flexShrink={1} mr={3}>
        {t("account.subHeader.cardTitle", { team })}
      </Text>
      <Link type={"main"} size={"small"} Icon={InfoMedium} onPress={openDrawer}>
        {t("account.subHeader.moreInfo")}
      </Link>
      <AccountSubHeaderDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        team={team}
        family={family}
      />
    </Flex>
  );
}

export default AccountSubHeader;
