import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { UserAvatar } from "../../components/UserAvatar";

export function ProfileSection() {
  const { t } = useTranslation();

  return (
    <Box lx={{ alignItems: "center", gap: "s12" }}>
      <UserAvatar />
      <Text typography="heading5SemiBold" lx={{ color: "base" }} testID="my-wallet-profile-title">
        {t("tabs.myWallet")}
      </Text>
    </Box>
  );
}
