import React from "react";
import sample from "lodash/sample";
import { Alert } from "react-native";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import SettingsRow from "~/components/SettingsRow";
import accountModel from "~/logic/accountModel";
import { saveAccounts } from "../../../../db";
import { useReboot } from "~/context/Reboot";

const CURRENCIES_FOR_NFT = ["ethereum", "polygon"];

async function injectMockAccountsInDB(count: number) {
  await saveAccounts({
    active: Array(count)
      .fill(null)
      .map(() =>
        accountModel.encode(
          genAccount(String(Math.random()), {
            currency: sample(
              listSupportedCurrencies().filter(c => CURRENCIES_FOR_NFT.includes(c.id)),
            ),
            withNft: true,
          }),
        ),
      ),
  });
}

export default function GenerateMockAccountsButton({
  count,
  title,
  desc,
}: {
  title: string;
  desc: string;
  count: number;
}) {
  const reboot = useReboot();
  return (
    <SettingsRow
      title={title}
      desc={desc}
      iconLeft={<IconsLegacy.CameraMedium size={24} color="black" />}
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
