import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { Keyboard, SafeAreaView, StyleSheet, View } from "react-native";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import Button from "~/components/Button";
import KeyboardView from "~/components/KeyboardView";
import NavigationScrollView from "~/components/NavigationScrollView";
import LText from "~/components/LText";
import TextInput from "~/components/FocusedTextInput";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

const options = {
  title: i18next.t("send.summary.fees"),
  headerLeft: undefined,
};

type Navigation = CompositeScreenProps<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.KaspaEditCustomFees>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.KaspaEditCustomFees>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.KaspaEditCustomFees>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

type Props = Navigation;

function KaspaEditCustomFees({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const sompiPerByte = route.params?.sompiPerByte;
  const setSompiPerByte = route.params?.setSompiPerByte;
  const { transaction } = route.params;
  const { account, parentAccount } = useAccountScreen(route);
  invariant(account, "no account found");
  const [ownSompiPerByte, setOwnSompiPerByte] = useState(
    sompiPerByte ? sompiPerByte.toString() : "",
  );

  const onChange = useCallback((text: string) => {
    setOwnSompiPerByte(text.replace(/\D/g, ""));
  }, []);

  const onValidateText = useCallback(() => {
    if (BigNumber(ownSompiPerByte || 0).isZero()) return;
    Keyboard.dismiss();
    setSompiPerByte && setSompiPerByte(BigNumber(ownSompiPerByte || 0));
    const bridge = getAccountBridge(account, parentAccount);
    navigation.navigate(NavigatorName.SendFunds, {
      screen: ScreenName.SendSummary,
      params: {
        ...route.params,
        accountId: account.id,
        transaction: bridge.updateTransaction(transaction, {
          customFeeRate: BigNumber(ownSompiPerByte || 0),
          feesStrategy: "custom",
        }),
      },
    });
  }, [
    setSompiPerByte,
    ownSompiPerByte,
    account,
    parentAccount,
    route.params,
    navigation,
    transaction,
  ]);
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
        <NavigationScrollView>
          <View style={styles.inputBox}>
            <TextInput
              autoFocus
              style={[
                styles.textInputAS,
                {
                  color: colors.darkBlue,
                },
              ]}
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={10}
              onChangeText={onChange}
              onSubmitEditing={onValidateText}
              value={ownSompiPerByte}
            />
            <LText
              style={[
                styles.currency,
                {
                  color: colors.grey,
                },
              ]}
            >
              {t("common.sompiPerByte")}
            </LText>
          </View>
          <View style={styles.flex}>
            <Button
              event="KaspaSetSompiPerByte"
              type="primary"
              title={t("common.continue")}
              onPress={onValidateText}
              containerStyle={styles.buttonContainer}
              disabled={BigNumber(ownSompiPerByte || 0).isZero()}
            />
          </View>
        </NavigationScrollView>
      </KeyboardView>
    </SafeAreaView>
  );
}

export { options, KaspaEditCustomFees as component };
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inputBox: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  body: {
    flexDirection: "column",
    flex: 1,
  },
  textInputAS: {
    fontSize: 30,
  },
  currency: {
    fontSize: 20,
    padding: 6,
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
