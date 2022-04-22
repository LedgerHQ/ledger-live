// @flow
import React from "react";
import sample from "lodash/sample";
import { Alert } from "react-native";
import { genAccount } from "@ledgerhq/live-common/lib/mock/account";
import { listSupportedCurrencies } from "@ledgerhq/live-common/lib/currencies";
import SettingsRow from "../../../components/SettingsRow";
import accountModel from "../../../logic/accountModel";
import { saveAccounts } from "../../../db";
import { useReboot } from "../../../context/Reboot";

async function injectMockAccountsInDB(count) {
  await saveAccounts({
    active: Array(count)
      .fill(null)
      .map(() =>
        accountModel.encode(
          genAccount(String(Math.random()), {
            currency: sample(listSupportedCurrencies()),
          }),
        ),
      ),
  });
}

export default function GenerateMockAccountsButton({
  count,
  title,
}: {
  title: string,
  count: number,
}) {
  const reboot = useReboot();
  return (
    <SettingsRow
      title={title}
      onPress={() => {
        Alert.alert(
          "This will erase existing accounts",
          "Continue?",
          [
            {
              text: "Cancel",
              onPress: () => {},
            },
            {
              text: "Ok",
              onPress: async () => {
                await injectMockAccountsInDB(count);
                reboot();
              },
            },
          ],
          { cancelable: true },
        );
      }}
    />
  );
}
