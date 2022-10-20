import React, { useState, useCallback, useEffect } from "react";
import { View } from "react-native";
import { useSelector } from "react-redux";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SettingsMedium, OthersMedium } from "@ledgerhq/native-ui/assets/icons";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { NavigatorName, ScreenName } from "../../const";
import Touchable from "../../components/Touchable";
import {
  accountScreenSelector,
  accountsSelector,
} from "../../reducers/accounts";
import TokenContextualModal from "../Settings/Accounts/TokenContextualModal";

export default function AccountHeaderRight() {
  const navigation = useNavigation();
  const route = useRoute();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const accounts = useSelector(accountsSelector);

  const [isOpened, setOpened] = useState(false);

  const toggleModal = useCallback(() => setOpened(!isOpened), [isOpened]);
  const closeModal = () => {
    setOpened(false);
  };

  const currency = getAccountCurrency(account);
  const cryptoAccounts = accounts.filter(
    account => account.currency.id === currency.id,
  );

  useEffect(() => {
    if (!account) {
      navigation.navigate(ScreenName.Accounts);
    }
  }, [account, navigation]);

  if (!account) return null;

  if (account.type === "TokenAccount" && parentAccount) {
    return (
      <>
        <Touchable
          event="ShowContractAddress"
          onPress={toggleModal}
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          <View>
            <OthersMedium size={24} color={"neutral.c100"} />
          </View>
        </Touchable>
        <TokenContextualModal
          account={account}
          isOpened={isOpened}
          onClose={closeModal}
        />
      </>
    );
  }

  if (account.type === "Account") {
    return (
      <Touchable
        event="button_clicked"
        eventProperties={{
          button: "Account Settings",
        }}
        onPress={() => {
          navigation.navigate(NavigatorName.AccountSettings, {
            screen: ScreenName.AccountSettingsMain,
            params: {
              accountId: account.id,
              hasOtherAccountsForThisCrypto:
                cryptoAccounts && cryptoAccounts.length > 1,
            },
          });
        }}
        style={{ alignItems: "center", justifyContent: "center" }}
      >
        <View>
          <SettingsMedium size={24} color="neutral.c100" />
        </View>
      </Touchable>
    );
  }

  return null;
}
