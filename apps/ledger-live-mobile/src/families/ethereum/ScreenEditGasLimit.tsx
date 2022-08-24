import { BigNumber } from "bignumber.js";
import React, { useState, useCallback } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Keyboard, StyleSheet, View } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useTheme } from "@react-navigation/native";
import type { Transaction } from "@ledgerhq/live-common/families/ethereum/types";
import Button from "../../components/Button";
import KeyboardView from "../../components/KeyboardView";
import NavigationScrollView from "../../components/NavigationScrollView";
import TextInput from "../../components/FocusedTextInput";

const forceInset = {
  bottom: "always",
};
const options = {
  title: <Trans i18nKey="send.summary.gasLimit" />,
  headerLeft: null,
};
type RouteParams = {
  accountId: string;
  transaction: Transaction;
  currentNavigation: string;
  gasLimit: BigNumber | null | undefined;
  setGasLimit: (..._: Array<any>) => any;
};
type Props = {
  navigation: any;
  route: {
    params: RouteParams;
  };
};

function EthereumEditGasLimit({ navigation, route }: Props) {
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
  return (
    <SafeAreaView
      style={{
        flex: 1,
      }}
      forceInset={forceInset}
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
            onChangeText={setOwnGasLimit}
            onSubmitEditing={onValidateText}
          />

          <View style={styles.flex}>
            <Button
              event="EthereumSetGasLimit"
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

export { options, EthereumEditGasLimit as component };
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
