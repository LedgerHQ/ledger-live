import React, { useCallback, useState, memo, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trans, useTranslation } from "react-i18next";
import {
  getAccountName,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import { useSelector } from "react-redux";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import { accountScreenSelector } from "../../reducers/accounts";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import Button from "../../components/Button";
import WalletIcon from "../../icons/Wallet";
import LText from "../../components/LText";
import {
  getMessageProperties,
  NanoDisplayedInfoFor712,
} from "../../helpers/signMessageUtils";
import ParentCurrencyIcon from "../../components/ParentCurrencyIcon";
import { SignMessageNavigatorStackParamList } from "../../components/RootNavigator/types/SignMessageNavigator";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";

const MessageProperty = memo(
  ({
    label,
    value,
  }: {
    label: string;
    value: string | string[] | null | undefined;
  }) => {
    const { colors } = useTheme();

    if (!value) return null;

    return (
      <View style={styles.messageProperty}>
        <LText style={styles.messagePropertyLabel} bold>
          {label}
        </LText>
        <LText
          style={[
            styles.messagePropertyValue,
            {
              color: colors.grey,
            },
          ]}
        >
          {typeof value === "string" ? (
            value
          ) : (
            <View style={styles.propertiesList}>
              {value.map((v, i) => (
                <LText
                  style={[
                    styles.messagePropertyValue,
                    {
                      color: colors.grey,
                    },
                  ]}
                  key={i}
                >{`${v}${i < value.length - 1 ? "," : ""}`}</LText>
              ))}
            </View>
          )}
        </LText>
      </View>
    );
  },
);
MessageProperty.displayName = "MessageProperty";

const MessageProperties = memo(
  (props: { properties: { label: string; value: string | string[] }[] }) => {
    const { properties } = props;
    return (
      <View>
        {properties.map((p, i) => (
          <MessageProperty key={i} {...p} />
        ))}
      </View>
    );
  },
);
MessageProperties.displayName = "MessageProperties";

function SignSummary({
  navigation,
  route,
}: StackNavigatorProps<
  SignMessageNavigatorStackParamList,
  ScreenName.SignSummary
>) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account not found");

  const mainAccount = getMainAccount(account, parentAccount);

  const { nextNavigation, message: messageData } = route.params;
  const navigateToNext = useCallback(() => {
    nextNavigation &&
      // @ts-expect-error impossible to type navigation hacks
      navigation.navigate(nextNavigation, {
        ...route.params,
      });
  }, [navigation, nextNavigation, route.params]);
  const onContinue = useCallback(() => {
    navigateToNext();
  }, [navigateToNext]);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [messageProperties, setMessageProperties] = useState<{
    message?: string;
    fields?: NanoDisplayedInfoFor712;
  }>({});

  useEffect(() => {
    getMessageProperties(mainAccount.currency, messageData).then(
      setMessageProperties,
    );
  }, [mainAccount.currency, messageData, setMessageProperties]);

  const { message, fields } = messageProperties;

  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen category="SignMessage" name="Summary" />
      <View style={styles.body}>
        <View style={styles.fromContainer}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: colors.lightLive,
              },
            ]}
          >
            <WalletIcon size={16} />
          </View>
          <View style={styles.fromInnerContainer}>
            <LText style={styles.from}>
              <Trans i18nKey="walletconnect.from" />
            </LText>
            <View style={styles.headerContainer}>
              <View style={styles.headerIconContainer}>
                <ParentCurrencyIcon size={18} currency={mainAccount.currency} />
              </View>
              <LText semiBold secondary numberOfLines={1}>
                {getAccountName(mainAccount)}
              </LText>
            </View>
          </View>
        </View>
        <View
          style={[
            styles.separator,
            {
              backgroundColor: colors.separator,
            },
          ]}
        />
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.messageContainer}>
            {fields ? (
              <MessageProperties properties={fields} />
            ) : (
              <MessageProperty label={"message"} value={message} />
            )}
          </View>
          {fields ? (
            <View>
              <Button
                type="color"
                onPress={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced
                  ? `- ${t("signMessage.eip712.hideFullMessage")}`
                  : `+ ${t("signMessage.eip712.showFullMessage")}`}
              </Button>
              {showAdvanced ? (
                <LText
                  style={[
                    styles.advancedMessageArea,
                    {
                      backgroundColor: colors.pillActiveBackground,
                    },
                  ]}
                >
                  {typeof messageData.message === "string"
                    ? `"${messageData.message}"`
                    : JSON.stringify(messageData.message, null, 2)}
                </LText>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </View>
      <View style={styles.footer}>
        <Button
          event="SummaryContinue"
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          containerStyle={styles.continueButton}
          onPress={onContinue}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "column",
  },
  body: {
    flex: 1,
  },
  fromContainer: {
    marginBottom: 30,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  headerContainer: {
    flexDirection: "row",
    marginTop: 6,
  },
  headerIconContainer: {
    marginRight: 8,
    justifyContent: "center",
  },
  fromInnerContainer: {
    marginLeft: 16,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  from: {
    opacity: 0.5,
  },
  messageContainer: {
    flex: 1,
    paddingVertical: 20,
  },
  propertiesList: {
    marginBottom: 10,
  },
  messageProperty: {
    marginBottom: 20,
  },
  messagePropertyLabel: {
    fontSize: 12,
  },
  messagePropertyValue: {
    marginTop: 10,
    fontSize: 12,
  },
  advancedMessageArea: {
    marginTop: 20,
    fontSize: 9,
    fontFamily: "Courier New",
    padding: 20,
  },
  message: {
    opacity: 0.5,
    marginBottom: 11,
    marginTop: 33,
  },
  separator: {
    height: 1,
  },
  footer: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  continueButton: {
    alignSelf: "stretch",
  },
});
export default SignSummary;
