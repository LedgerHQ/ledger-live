import React from "react";
import { StyleSheet } from "react-native";
import { Flex, Icons } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import type { AleoNonEarningReason } from "@ledgerhq/live-common/families/aleo/react";
import { useTranslation } from "~/context/Locale";
import Skeleton from "~/components/Skeleton";
import CheckCircle from "~/icons/CheckCircle";

const ICON_SIZE = 14;

type Props = Readonly<{
  nonEarningReason: AleoNonEarningReason | undefined;
  loading?: boolean;
  unverified?: boolean;
}>;

export default function StatusIcon({ nonEarningReason, loading, unverified }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (loading) {
    return <Skeleton loading style={styles.skeleton} />;
  }

  if (unverified) {
    return (
      <Flex testID="aleo-status-unverified" accessibilityLabel={t("aleo.stake.status.unknown")}>
        <Icons.InformationFill size="XS" color="neutral.c70" />
      </Flex>
    );
  }

  if (!nonEarningReason) {
    return (
      <CheckCircle
        size={ICON_SIZE}
        color={colors.success}
        testID="aleo-status-earning"
        accessibilityLabel={t("aleo.stake.status.earning")}
      />
    );
  }

  // Icons.Warning accepts neither testID nor accessibilityLabel, unlike CheckCircle.
  return (
    <Flex
      testID="aleo-status-non-earning"
      accessibilityLabel={t(`aleo.stake.nonEarning.${nonEarningReason}`)}
    >
      <Icons.Warning size="XS" color="warning.c70" />
    </Flex>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
  },
});
