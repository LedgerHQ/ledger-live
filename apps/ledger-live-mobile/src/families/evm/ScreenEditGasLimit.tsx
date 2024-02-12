import { BigNumber } from "bignumber.js";
import React, { useState, useCallback } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Keyboard, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import Button from "~/components/Button";
import KeyboardView from "~/components/KeyboardView";
import NavigationScrollView from "~/components/NavigationScrollView";
import TextInput from "~/components/FocusedTextInput";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import { ScreenName } from "~/const";

const options = {
  title: <Trans i18nKey="send.summary.gasLimit" />,
  headerLeft: undefined,
};

type NavigationProps = BaseComposite<
  StackNavigatorProps<
    SendFundsNavigatorStackParamList | SignTransactionNavigatorParamList | SwapNavigatorParamList,
    ScreenName.EvmEditGasLimit
  >
>;

function EvmEditGasLimit({ navigation, route }: NavigationProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const gasLimit = route.params?.gasLimit;
  const setGasLimit = route.params?.setGasLimit;
  const [ownGasLimit, setOwnGasLimit] = useState(gasLimit);
  const onValidateText = useCallback(() => {
    Keyboard.dismiss();
    navigation.goBack();
    setGasLimit(BigNumber(ownGasLimit || 0));
  }, [setGasLimit, ownGasLimit, navigation]);

  const onChangeText = useCallback((v: string) => {
    const n = BigNumber(v);
    setOwnGasLimit(n);
  }, []);
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
          <TextInput
            autoFocus
            style={[
              styles.textInputAS,
              {
                color: colors.darkBlue,
              },
            ]}
            defaultValue={gasLimit ? gasLimit.toString() : ""}
            keyboardType="numeric"
            returnKeyType="done"
            maxLength={10}
            onChangeText={onChangeText}
            onSubmitEditing={onValidateText}
          />

          <View style={styles.flex}>
            <Button
              event="EvmSetGasLimit"
              type="primary"
              title={t("send.summary.validateGasLimit")}
              onPress={onValidateText}
              containerStyle={styles.buttonContainer}
            />
          </View>
        </NavigationScrollView>
      </KeyboardView>
    </SafeAreaView>
  );
}

export { options, EvmEditGasLimit as component };
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
