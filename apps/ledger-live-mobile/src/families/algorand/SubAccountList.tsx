import React, { useCallback } from "react";
import { StyleSheet, View, Linking } from "react-native";
import { Trans } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import IconPlus from "~/icons/Plus";
import Button from "~/components/Button";
import { NavigatorName, ScreenName } from "~/const";
import LText from "~/components/LText";
import { urls } from "~/utils/urls";
import ExternalLink from "~/components/ExternalLink";
import { accountScreenSelector } from "~/reducers/accounts";

const ReceiveButton = ({ accountId }: { accountId: string }) => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const onReceiveClick = useCallback(() => {
    navigation.navigate(NavigatorName.AlgorandOptInFlow, {
      screen: ScreenName.AlgorandOptInSelectToken,
      params: {
        accountId,
      },
    });
  }, [navigation, accountId]);
  return (
    <Button
      onPress={onReceiveClick}
      IconLeft={() => <IconPlus size={16} color={colors.live} />}
      title={<Trans i18nKey="account.tokens.algorand.addTokens" />}
      containerStyle={{
        width: 120,
      }}
      type="lightSecondary"
      event="AccountReceiveASA"
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
    navigation.navigate(NavigatorName.AlgorandOptInFlow, {
      screen: ScreenName.AlgorandOptInSelectToken,
      params: {
        accountId,
      },
    });
  }, [navigation, accountId]);
  const howAsaWorks = useCallback(() => {
    Linking.openURL(urls.supportLinkByTokenType.asa);
  }, []);
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
            i18nKey={`account.tokens.algorand.howTo`}
            values={{
              currency: "algorand",
            }}
          />
        </LText>
      </View>
      <View
        style={[
          styles.howAsaWorks,
          {
            borderColor: colors.live,
          },
        ]}
      >
        <ExternalLink
          event="AlgorandHowAsaWork"
          onPress={howAsaWorks}
          text={<Trans i18nKey="account.tokens.algorand.howAsaWorks" />}
        />
      </View>
      <Button
        event="AccountReceiveASA"
        type="primary"
        IconLeft={() => <IconPlus size={16} color={disabled ? colors.grey : colors.live} />}
        onPress={onReceiveClick}
        title={<Trans i18nKey="account.tokens.algorand.addAsa" />}
        disabled={disabled}
        containerStyle={styles.addAsaButton}
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
  },
  placeholderText: {
    flex: 1,
    flexShrink: 1,
    flexWrap: "wrap",
    flexDirection: "row",
  },
  howAsaWorks: {
    width: "100%",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  howAsaWorksText: {
    fontSize: 16,
    marginRight: 8,
  },
  addAsaButton: {
    width: "100%",
  },
});
export default {
  ReceiveButton,
  Placeholder,
  hasSpecificTokenWording: true,
};
