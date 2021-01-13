// @flow
import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import type { Currency } from "@ledgerhq/live-common/lib/types";
import InfoIcon from "../../../../icons/Info";
import LText from "../../../../components/LText";
import Button from "../../../../components/Button";
import { NavigatorName } from "../../../../const";

const NoAccountsEmptyState = ({
  selectedCurrency,
}: {
  selectedCurrency: Currency,
}) => {
  const { colors } = useTheme();
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
      <View
        style={[styles.iconContainer, { backgroundColor: colors.lightLive }]}
      >
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
      <LText style={styles.description} color="smoke">
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
    marginBottom: 24,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    fontSize: 16,
    marginBottom: 16,
  },
  description: {
    textAlign: "center",
    paddingHorizontal: 16,
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
