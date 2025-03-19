import { genAccount } from "@ledgerhq/live-common/mock/account";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";

import { initAccounts } from "~/renderer/actions/accounts";
import {
  initialState as liveWalletInitialState,
  accountUserDataExportSelector,
} from "@ledgerhq/live-wallet/store";
import { getKey } from "~/renderer/storage";
import { Account, AccountUserData } from "@ledgerhq/types-live";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/FeatureFlagsContext";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import React from "react";
import Button from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";
import { getEnv } from "@ledgerhq/live-env";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const createAccount = (currency: CryptoCurrency) => {
  const account = genAccount(String(Math.random()), { currency, withNft: true });
  const userData = accountUserDataExportSelector(liveWalletInitialState, { account });
  return [account, userData] as [Account, AccountUserData];
};

async function injectMockAccounts() {
  const currencies = getEnv("NFT_CURRENCIES");
  const accountData = await getKey("app", "accounts", []);

  const store = window.ledger.store;
  const supportedCurrencies =
    listSupportedCurrencies().filter(c => currencies.includes(c.id)) || [];

  const fakeAccounts = supportedCurrencies.map(createAccount);

  const newAccountData = accountData?.concat(fakeAccounts);
  const e = initAccounts(newAccountData || []);
  store.dispatch(e);
}

export default function GenerateMockAccountsWithNfts() {
  const { t } = useTranslation();
  const featureFlagsProvider = useFeatureFlags();

  const disableSimpleHash = () =>
    featureFlagsProvider.overrideFeature("nftsFromSimplehash", { enabled: false });

  return (
    <SettingsSectionRow
      title={t("settings.developer.debugNfts.generatorAndDestructor.genAcc")}
      desc={t("settings.developer.debugNfts.generatorAndDestructor.genAccDesc")}
    >
      <Button
        primary
        onClick={() => {
          disableSimpleHash();
          injectMockAccounts();
        }}
      >
        {t("settings.developer.debugNfts.generatorAndDestructor.cta")}
      </Button>
    </SettingsSectionRow>
  );
}
