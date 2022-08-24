import React from "react";
import sample from "lodash/sample";
import { Alert } from "react-native";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
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
  title: string;
  count: number;
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
              // eslint-disable-next-line @typescript-eslint/no-empty-function
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
          {
            cancelable: true,
          },
        );
      }}
    />
  );
}
