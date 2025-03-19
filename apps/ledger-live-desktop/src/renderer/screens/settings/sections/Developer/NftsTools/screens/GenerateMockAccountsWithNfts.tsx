import { genAccount } from "@ledgerhq/live-common/mock/account";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";

import { initAccounts } from "~/renderer/actions/accounts";
import {
  initialState as liveWalletInitialState,
  accountUserDataExportSelector,
} from "@ledgerhq/live-wallet/store";
import { getKey } from "~/renderer/storage";
import sample from "lodash/sample";
import { Account, AccountUserData } from "@ledgerhq/types-live";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/FeatureFlagsContext";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import React from "react";
import Button from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";

const CURRENCIES_FOR_NFT = ["ethereum", "polygon"];

async function injectMockAccounts(count: number) {
  const accountData = await getKey("app", "accounts", []);

  const store = window.ledger.store;

  const fakeAccounts = Array(count)
    .fill(null)
    .map(() => {
      const account = genAccount(String(Math.random()), {
        currency: sample(listSupportedCurrencies().filter(c => CURRENCIES_FOR_NFT.includes(c.id))),
        withNft: true,
      });
      const userData = accountUserDataExportSelector(liveWalletInitialState, { account });
      return [account, userData] as [Account, AccountUserData];
    });

  const newAccountData = accountData?.concat(fakeAccounts);
  const e = initAccounts(newAccountData || []);
  store.dispatch(e);
}

export default function GenerateMockAccountsWithNfts() {
  const { t } = useTranslation();
  const featureFlagsProvider = useFeatureFlags();

  const disableSimpleHash = () =>
    featureFlagsProvider.overrideFeature("nftsFromSimplehash", { enabled: false });

  const nftAccounts = Math.floor(Math.random() * 8) + 3;

  return (
    <SettingsSectionRow
      title={t("settings.developer.debugNfts.generatorAndDestructor.genAcc")}
      desc={t("settings.developer.debugNfts.generatorAndDestructor.genAccDesc")}
    >
      <Button
        primary
        onClick={() => {
          disableSimpleHash();
          injectMockAccounts(nftAccounts);
        }}
      >
        {t("settings.developer.debugNfts.generatorAndDestructor.cta", { count: nftAccounts })}
      </Button>
    </SettingsSectionRow>
  );
}
