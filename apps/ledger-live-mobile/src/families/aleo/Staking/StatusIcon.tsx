import React from "react";
import { Flex, Icons } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import type { AleoNonEarningReason } from "@ledgerhq/live-common/families/aleo/react";
import { useTranslation } from "~/context/Locale";
import CheckCircle from "~/icons/CheckCircle";

export default function StatusIcon({
  nonEarningReason,
}: {
  nonEarningReason: AleoNonEarningReason | undefined;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (!nonEarningReason) {
    return (
      <CheckCircle
        size={14}
        color={colors.success}
        testID="aleo-status-earning"
        accessibilityLabel={t("aleo.stake.status.earning")}
      />
    );
  }

  // Icons.Warning doesn't accept a testID prop, unlike CheckCircle.
  return (
    <Flex testID="aleo-status-non-earning">
      <Icons.Warning size="XS" color="warning.c70" />
    </Flex>
  );
}
