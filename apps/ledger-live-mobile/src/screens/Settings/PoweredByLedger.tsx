import { useTheme } from "@react-navigation/native";
import React from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import LText from "~/components/LText";
import LedgerLogoRec from "~/icons/LedgerLogoRec";

export default function PoweredByLedger() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <LText secondary semiBold style={styles.textStyle} color="grey">
        {t("common.poweredBy")}
      </LText>
      <View style={styles.iconStyle}>
        <LedgerLogoRec height={17} width={68} color={colors.grey} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "center",
  },
  textStyle: {
    justifyContent: "center",
    fontSize: 12,
  },
  iconStyle: {
    marginLeft: 5,
    alignSelf: "flex-end",
  },
});
