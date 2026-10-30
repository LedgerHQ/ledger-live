import React from "react";
import { Alert } from "react-native";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import SettingsRow from "~/components/SettingsRow";
import { reboot } from "~/actions/appstate";
import { useDispatch, useStore } from "~/context/hooks";
import { addOneAccount } from "~/actions/accounts";
import { exportSelector } from "~/reducers/accounts";
import { saveAccounts } from "~/db";

const EMPTY_ACCOUNT_INDEX = 40;

export function createEmptyActivityAccount() {
  const account = genAccount("empty-activity", {
    currency: getCryptoCurrencyById("ethereum"),
    operationsSize: 0,
    subAccountsCount: 0,
  });
  account.index = EMPTY_ACCOUNT_INDEX;
  return account;
}

export default function GenerateEmptyAccountButton() {
  const dispatch = useDispatch();
  const store = useStore();

  return (
    <SettingsRow
      title="Empty account"
      desc="Add Ethereum 41, an account with no transactions. Existing accounts stay."
      iconLeft={<IconsLegacy.WalletMedium size={24} color="black" />}
      onPress={() => {
        Alert.alert(
          "Add an account with no activity",
          "Ethereum 41 will be added. Your other accounts stay.",
          [
            { text: "Cancel", onPress: () => {} },
            {
              text: "Ok",
              onPress: async () => {
                dispatch(addOneAccount(createEmptyActivityAccount()));
                await saveAccounts(await exportSelector(store.getState()));
                dispatch(reboot());
              },
            },
          ],
          { cancelable: true },
        );
      }}
    />
  );
}
