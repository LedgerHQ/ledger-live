import React from "react";
import { useTranslation } from "react-i18next";
import Button from "~/renderer/components/Button";
import { Icons, Text, Flex } from "@ledgerhq/react-ui";

const AccountsEntryPoint = ({ onPress }: { onPress: () => void }) => {
  const { t } = useTranslation();

  return (
    <Button small lighterPrimary onClick={onPress}>
      <Flex alignItems="center" justifyContent="center">
        <Icons.Refresh size="XS" color="neutral.c100" />
        <Text color="neutral.c100" ml="8px">
          {t("walletSync.entryPoints.accounts.title")}
        </Text>
      </Flex>
    </Button>
  );
};

export default AccountsEntryPoint;
