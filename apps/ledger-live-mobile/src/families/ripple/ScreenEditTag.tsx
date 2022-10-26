import React, { useCallback, useState } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useTheme } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import { i18n } from "../../context/Locale";
import KeyboardView from "../../components/KeyboardView";
import Button from "../../components/Button";
import NavigationScrollView from "../../components/NavigationScrollView";
import { accountScreenSelector } from "../../reducers/accounts";
import { ScreenName } from "../../const";
import { track } from "../../analytics";
import TextInput from "../../components/FocusedTextInput";
import { BaseComposite } from "../../components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";

type NavigationProps = BaseComposite<
  StackScreenProps<SendFundsNavigatorStackParamList, ScreenName.RippleEditTag>
>;

const uint32maxPlus1 = BigNumber(2).pow(32);
const options = {
  title: i18n.t("send.summary.tag"),
  headerLeft: undefined,
};

function RippleEditTag({ route, navigation }: NavigationProps) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const { t } = useTranslation();
  const transaction = route.params?.transaction;
  const [tag, setTag] = useState<BigNumber | null | undefined>(() => {
    if (transaction.tag) {
      return BigNumber(transaction.tag);
    }

    return undefined;
  });
  const onTagFieldFocus = useCallback(() => {
    track("SendTagFieldFocusedXRP");
  }, []);

  function onChangeTag(str: string): void {
    const tagNumeric = BigNumber(str.replace(/[^0-9]/g, ""));
    const newTag =
      tagNumeric.isInteger() &&
      tagNumeric.isPositive() &&
      tagNumeric.lt(uint32maxPlus1)
        ? tagNumeric
        : undefined;
    setTag(newTag);
  }

  const onValidateText = useCallback(() => {
    if (!account) return;
    const bridge = getAccountBridge(account);
    // @ts-expect-error FIXME: no current / next navigation param?
    navigation.navigate(ScreenName.SendSummary, {
      accountId: account.id,
      transaction: bridge.updateTransaction(transaction, {
        tag: tag && tag.toNumber(),
      }),
    });
  }, [navigation, account, tag, transaction]);
  return (
    <SafeAreaView
      style={{
        flex: 1,
      }}
    >
      <KeyboardView
        style={[
          styles.body,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <NavigationScrollView keyboardShouldPersistTaps="always">
          <TextInput
            allowFontScaling={false}
            autoFocus
            style={[
              styles.textInputAS,
              {
                color: colors.darkBlue,
              },
            ]}
            defaultValue={tag ? tag.toString() : ""}
            keyboardType="numeric"
            returnKeyType="done"
            onChangeText={onChangeTag}
            onFocus={onTagFieldFocus}
            onSubmitEditing={onValidateText}
          />

          <View style={styles.flex}>
            <Button
              event="RippleEditTag"
              type="primary"
              title={t("send.summary.validateTag")}
              onPress={onValidateText}
              containerStyle={styles.buttonContainer}
            />
          </View>
        </NavigationScrollView>
      </KeyboardView>
    </SafeAreaView>
  );
}

export { options, RippleEditTag as component };
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flexDirection: "column",
    flex: 1,
  },
  textInputAS: {
    padding: 16,
    fontSize: 30,
  },
  buttonContainer: {
    marginHorizontal: 16,
  },
  flex: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
});
