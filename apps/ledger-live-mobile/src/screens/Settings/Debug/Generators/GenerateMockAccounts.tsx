import React from "react";
import sample from "lodash/sample";
import { Alert } from "react-native";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { Account } from "@ledgerhq/types-live";
import SettingsRow from "~/components/SettingsRow";
import { useReboot } from "~/context/Reboot";
import { useDispatch, useSelector } from "react-redux";
import { accountsSelector } from "~/reducers/accounts";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";

function createMockAccounts(count: number, existingAccounts: Account[]) {
  const mockAccounts = Array(count)
    .fill(null)
    .map(() => {
      return genAccount(String(Math.random()), {
        currency: sample(listSupportedCurrencies()),
      });
    });

  return addAccountsAction({
    existingAccounts,
    scannedAccounts: mockAccounts,
    selectedIds: mockAccounts.map(acc => acc.id),
    renamings: {},
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
  const dispatch = useDispatch();
  const existingAccounts = useSelector(accountsSelector);

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
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              onPress: () => {},
            },
            {
              text: "Ok",
              onPress: () => {
                const action = createMockAccounts(count, existingAccounts);
                dispatch(action);
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
