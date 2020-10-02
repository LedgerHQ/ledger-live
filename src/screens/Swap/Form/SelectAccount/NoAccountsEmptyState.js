// @flow
import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import type { Currency } from "@ledgerhq/live-common/lib/types";
import InfoIcon from "../../../../icons/Info";
import colors from "../../../../colors";
import LText from "../../../../components/LText";
import Button from "../../../../components/Button";
import { NavigatorName } from "../../../../const";

const NoAccountsEmptyState = ({
  selectedCurrency,
}: {
  selectedCurrency: Currency,
}) => {
  const { navigate } = useNavigation();
  const onAddAccount = useCallback(
    () =>
      navigate(
        NavigatorName.AddAccounts,
        selectedCurrency.type === "TokenCurrency"
          ? { token: selectedCurrency }
          : { selectedCurrency },
      ),
    [navigate, selectedCurrency],
  );

  return (
    <View style={styles.emptyStateBody}>
      <View style={styles.iconContainer}>
        <InfoIcon size={22} color={colors.live} />
      </View>
      <LText semiBold style={styles.title}>
        <Trans
          i18nKey={"transfer.swap.emptyState.title"}
          values={{
            currency: selectedCurrency.name,
          }}
        />
      </LText>
      <LText style={styles.description}>
        <Trans
          i18nKey={"transfer.swap.emptyState.description"}
          values={{
            currency: selectedCurrency.name,
          }}
        />
      </LText>
      <View style={styles.buttonContainer}>
        <Button
          containerStyle={styles.button}
          event="ExchangeStartBuyFlow"
          type="primary"
          title={<Trans i18nKey={"transfer.swap.emptyState.CTAButton"} />}
          onPress={onAddAccount}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  addAccountButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 16,
    alignItems: "center",
  },
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  tokenCardStyle: {
    marginLeft: 26,
    paddingLeft: 7,
    borderLeftWidth: 1,
    borderLeftColor: colors.fog,
  },
  card: {
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  searchContainer: {
    paddingTop: 18,
    flex: 1,
  },
  list: {
    paddingTop: 8,
  },
  emptyResults: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: colors.fog,
  },
  emptyStateBody: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 50,
    backgroundColor: colors.lightLive,
    marginBottom: 24,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    color: colors.darkBlue,
    fontSize: 16,
    marginBottom: 16,
  },
  description: {
    textAlign: "center",
    paddingHorizontal: 16,
    color: colors.smoke,
    fontSize: 14,
  },
  buttonContainer: {
    paddingTop: 24,
    paddingLeft: 16,
    paddingRight: 16,
    flexDirection: "row",
  },
  button: {
    flex: 1,
  },
  addButton: {
    marginTop: 16,
    paddingLeft: 8,
    alignItems: "flex-start",
  },
});

export default NoAccountsEmptyState;
