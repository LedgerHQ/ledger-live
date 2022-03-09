/* @flow */
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import AccountSubHeaderDrawer from "./AccountSubHeaderDrawer";
import InfoIcon from "../../icons/Info";
import Chevron from "../../icons/Chevron";
import LText from "../../components/LText";
import { withTheme } from "../../colors";
import Button from "../../components/Button";

type Props = {
  colors: any,
};

function AccountSubHeader({ colors }: Props) {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const { t } = useTranslation();

  function openDrawer() {
    setIsDrawerOpen(true);
  }

  function closeDrawer() {
    setIsDrawerOpen(false);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeaderContainer}>
        <InfoIcon size={16} color={colors.grey} />
        <LText color={colors.grey} style={styles.cardHeader}>
          {t("cryptoOrg.account.subHeader.cardTitle")}
        </LText>
      </View>
      <Button
        type={"lightSecondary"}
        IconRight={Chevron}
        onPress={openDrawer}
        title={t("cryptoOrg.account.subHeader.moreInfo")}
      />
      <AccountSubHeaderDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    margin: 16,
    padding: 16,
    marginBottom: 0,
    paddingVertical: 8,
    paddingRight: 0,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
          height: 4,
        },
      },
    }),
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  cardHeaderContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeader: {
    fontWeight: "600",
    fontSize: 16,
    color: "#142533DD",
    marginLeft: 8,
  },
  customTouchableHighlight: {
    paddingRight: 14,
  },
});

export default withTheme(AccountSubHeader);
