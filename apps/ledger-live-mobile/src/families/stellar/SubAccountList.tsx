import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import IconPlus from "~/icons/Plus";
import Button from "~/components/Button";
import { NavigatorName, ScreenName } from "~/const";
import LText from "~/components/LText";
import { accountScreenSelector } from "~/reducers/accounts";

const ReceiveButton = ({ accountId }: { accountId: string }) => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const onReceiveClick = useCallback(() => {
    navigation.navigate(NavigatorName.StellarAddAssetFlow, {
      screen: ScreenName.StellarAddAssetSelectAsset,
      params: {
        accountId,
      },
    });
  }, [navigation, accountId]);
  return (
    <Button
      onPress={onReceiveClick}
      IconLeft={() => <IconPlus size={16} color={colors.live} />}
      title={<Trans i18nKey="account.tokens.stellar.addTokens" />}
      type="lightSecondary"
      event="AccountAddAsset"
    />
  );
};

const Placeholder = ({ accountId }: { accountId: string }) => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { account } = useSelector(
    accountScreenSelector({
      params: {
        accountId,
      },
    }),
  );
  const onReceiveClick = useCallback(() => {
    navigation.navigate(NavigatorName.StellarAddAssetFlow, {
      screen: ScreenName.StellarAddAssetSelectAsset,
      params: {
        accountId,
      },
    });
  }, [navigation, accountId]);
  const disabled = !account || account.balance.lte(0);
  return (
    <View
      style={[
        styles.placeholder,
        {
          borderColor: colors.fog,
        },
      ]}
    >
      <View style={styles.placeholderText}>
        <LText style={styles.description}>
          <Trans
            i18nKey={`account.tokens.stellar.howTo`}
            values={{
              currency: "stellar",
            }}
          />
        </LText>
      </View>
      <Button
        event="AccountAddAsset"
        type="primary"
        IconLeft={() => <IconPlus size={16} color={disabled ? colors.grey : colors.live} />}
        onPress={onReceiveClick}
        title={<Trans i18nKey="account.tokens.stellar.addAsset" />}
        disabled={disabled}
        containerStyle={styles.addAssetButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    borderRadius: 4,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "column",
    alignItems: "center",
    overflow: "hidden",
  },
  description: {
    fontSize: 16,
    paddingBottom: 16,
  },
  placeholderText: {
    flex: 1,
    flexShrink: 1,
    flexWrap: "wrap",
    flexDirection: "row",
  },
  addAssetButton: {
    width: "100%",
  },
});
export default {
  ReceiveButton,
  Placeholder,
  hasSpecificTokenWording: true,
};
