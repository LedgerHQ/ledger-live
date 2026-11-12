import React from "react";
import { useTheme } from "styled-components/native";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { App } from "@ledgerhq/types-live";
import { isLedgerApp } from "@ledgerhq/live-common/apps/developer";
import { useTranslation } from "~/context/Locale";
import IconBuilding from "~/icons/Building";

type Props = {
  app: Pick<App, "authorName">;
};

/** Who develops the app: Ledger (check icon) or a community developer (building icon). */
export default function AppDeveloper({ app }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isLedger = isLedgerApp(app);
  const label = app.authorName?.trim() || t("manager.appList.communityApp");

  return (
    <Flex
      flexDirection="row"
      alignItems="center"
      flexShrink={1}
      pl={3}
      testID="manager-app-developer"
    >
      {isLedger ? (
        <Icons.CheckmarkCircleFill size="XS" color="primary.c80" />
      ) : (
        <IconBuilding size={16} color={colors.neutral.c70} />
      )}
      <Text
        variant="small"
        fontWeight="medium"
        color="neutral.c70"
        ml={2}
        flexShrink={1}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Flex>
  );
}
