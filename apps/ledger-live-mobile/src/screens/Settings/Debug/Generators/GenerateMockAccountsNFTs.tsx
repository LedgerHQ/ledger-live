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
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";

import {
  initialState as liveWalletInitialState,
  accountUserDataExportSelector,
} from "@ledgerhq/live-wallet/store";

const CURRENCIES_FOR_NFT = ["ethereum", "polygon"];

async function injectMockAccountsInDB(count: number) {
  await saveAccounts({
    active: Array(count)
      .fill(null)
      .map(() => {
        const account = genAccount(String(Math.random()), {
          currency: sample(
            listSupportedCurrencies().filter(c => CURRENCIES_FOR_NFT.includes(c.id)),
          ),
          withNft: true,
        });
        const userData = accountUserDataExportSelector(liveWalletInitialState, { account });
        return accountModel.encode([account, userData]);
      }),
  });
}

export default function GenerateMockAccountsAndNFTsButton({
  count,
  title,
  desc,
}: {
  title: string;
  desc: string;
  count: number;
}) {
  const featureFlagsProvider = useFeatureFlags();
  const reboot = useReboot();

  const disableSimpleHash = () =>
    featureFlagsProvider.overrideFeature("nftsFromSimplehash", { enabled: false });

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
                disableSimpleHash();
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
