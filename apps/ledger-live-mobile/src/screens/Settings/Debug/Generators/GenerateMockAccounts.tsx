import React from "react";
import sample from "lodash/sample";
import { Alert } from "react-native";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import SettingsRow from "~/components/SettingsRow";
import { reboot } from "~/actions/appstate";
import { useDispatch } from "~/context/store";
import { replaceAccounts } from "~/actions/accounts";

const generateMockAccounts = (count: number) =>
  Array(count)
    .fill(null)
    .map(() => {
      return genAccount(String(Math.random()), {
        currency: sample(listSupportedCurrencies()),
      });
    });

export default function GenerateMockAccountsButton({
  count,
  title,
  desc,
}: {
  title: string;
  desc: string;
  count: number;
}) {
  const dispatch = useDispatch();

  return (
    <SettingsRow
      title={title}
      desc={desc}
      iconLeft={<IconsLegacy.LayersMedium size={24} color="black" />}
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
              onPress: () => {
                const mockAccounts = generateMockAccounts(count);

                dispatch(replaceAccounts(mockAccounts));
                dispatch(reboot());
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
