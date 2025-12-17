import React, { memo } from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import QrCode from "@ledgerhq/icons-ui/native/QrCode";
import type { Account } from "@ledgerhq/types-live";

import SummaryRowCustom from "./SummaryRowCustom";
import Circle from "~/components/Circle";
import LText from "~/components/LText";
import { useAccountName } from "~/reducers/wallet";

interface Props {
  account: Account;
}

function SummaryToSection({ account }: Readonly<Props>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const name = useAccountName(account);

  return (
    <SummaryRowCustom
      label={t("hedera.associate.summary.to")}
      iconLeft={
        <Circle bg={colors.opacityDefault.c05} size={34}>
          <QrCode size="S" color={colors.primary.c80} />
        </Circle>
      }
      data={
        <>
          <LText numberOfLines={1} style={styles.addressRowText}>
            {name}
          </LText>
          <LText numberOfLines={1} style={styles.addressRowText} color="neutral.c70">
            {account.freshAddress}
          </LText>
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  addressRowText: {
    fontSize: 14,
  },
});

export default memo<Props>(SummaryToSection);
