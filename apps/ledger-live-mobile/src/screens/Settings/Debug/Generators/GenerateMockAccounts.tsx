import React from "react";
import sample from "lodash/sample";
import { Alert } from "react-native";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { Account } from "@ledgerhq/types-live";
import SettingsRow from "~/components/SettingsRow";
import { reboot } from "~/actions/appstate";
import { useDispatch, useSelector } from "react-redux";
import { accountsSelector } from "~/reducers/accounts";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";

const generateMockAccounts = (count: number) =>
  Array(count)
    .fill(null)
    .map(() => {
      return genAccount(String(Math.random()), {
        currency: sample(listSupportedCurrencies()),
      });
    });

const createAccountAction = (mockAccounts: Account[], existingAccounts: Account[]) =>
  addAccountsAction({
    existingAccounts,
    scannedAccounts: mockAccounts,
    selectedIds: mockAccounts.map(acc => acc.id),
    renamings: {},
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
              onPress: () => {},
            },
            {
              text: "Ok",
              onPress: () => {
                const mockAccounts = generateMockAccounts(count);
                const action = createAccountAction(mockAccounts, existingAccounts);

                dispatch(action);
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
