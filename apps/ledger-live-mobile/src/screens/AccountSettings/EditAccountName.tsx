import React, { useCallback, useState } from "react";
import i18next from "i18next";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Box } from "@ledgerhq/native-ui";
import TextInput from "~/components/TextInput";
import Button from "~/components/wrappedUi/Button";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { AddAccountsNavigatorParamList } from "~/components/RootNavigator/types/AddAccountsNavigator";
import { AccountSettingsNavigatorParamList } from "~/components/RootNavigator/types/AccountSettingsNavigator";
import {
  accountNameWithDefaultSelector,
  setAccountName as setAccountNameStore,
} from "@ledgerhq/live-wallet/store";
import { walletSelector } from "~/reducers/wallet";
import { accountScreenSelector } from "~/reducers/accounts";
import invariant from "invariant";
import { updateAccount } from "~/actions/accounts";
import { useTheme } from "styled-components/native";
import { getFontStyle } from "~/components/LText";

export const MAX_ACCOUNT_NAME_LENGHT = 50;

type NavigationProps =
  | StackNavigatorProps<AddAccountsNavigatorParamList, ScreenName.EditAccountName>
  | StackNavigatorProps<AccountSettingsNavigatorParamList, ScreenName.EditAccountName>;

const EditAccountName = ({ navigation, route }: NavigationProps) => {
  const { account } = useSelector(accountScreenSelector(route));

  const { colors } = useTheme();
  const { t } = useTranslation();
  invariant(account && account.type === "Account", "account is required");

  const dispatch = useDispatch();
  const walletState = useSelector(walletSelector);

  const [accountName, setAccountName] = useState(
    accountNameWithDefaultSelector(walletState, account),
  );

  const onChangeText = useCallback((name: string) => {
    setAccountName(name);
  }, []);

  const onNameEndEditing = useCallback(() => {
    const cleanAccountName = accountName.trim();
    if (!cleanAccountName.length) return;

    const { onAccountNameChange, account: accountFromAdd } = route.params ?? {};
    const isImportingAccounts = !!accountFromAdd;

    if (isImportingAccounts) {
      onAccountNameChange?.(cleanAccountName, accountFromAdd);
    } else {
      dispatch(updateAccount(account));
      dispatch(setAccountNameStore(account.id, cleanAccountName));
    }

    navigation.goBack();
  }, [accountName, route.params, navigation, dispatch, account]);

  const isApplyDisabled = !accountName.trim();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.main }]}>
      <Box px={6} flex={1}>
        <TextInput
          autoFocus
          value={accountName}
          defaultValue={accountName}
          returnKeyType="done"
          maxLength={MAX_ACCOUNT_NAME_LENGHT}
          onChangeText={onChangeText}
          onSubmitEditing={onNameEndEditing}
          clearButtonMode="while-editing"
          placeholder={i18next.t("account.settings.accountName.placeholder")}
          testID="account-rename-text-input"
        />
      </Box>
      <Button
        event="EditAccountNameApply"
        type="main"
        onPress={onNameEndEditing}
        disabled={isApplyDisabled}
        m={6}
        testID="account-rename-apply"
      >
        {t("common.apply")}
      </Button>
    </SafeAreaView>
  );
};

export default EditAccountName;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  body: {
    flexDirection: "column",
    flex: 1,
  },
  textInputAS: {
    padding: 16,
    fontSize: 20,
    ...getFontStyle({ semiBold: true }),
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
