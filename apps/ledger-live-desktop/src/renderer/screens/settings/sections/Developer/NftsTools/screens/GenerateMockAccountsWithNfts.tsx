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
import { getEnv } from "@ledgerhq/live-env";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const createAccount = (currency: CryptoCurrency) => {
  const account = genAccount(String(Math.random()), { currency, withNft: true });
  const userData = accountUserDataExportSelector(liveWalletInitialState, { account });
  return [account, userData] as [Account, AccountUserData];
};

async function injectMockAccounts(count: number) {
  const currencies = getEnv("NFT_CURRENCIES");
  const accountData = await getKey("app", "accounts", []);

  const store = window.ledger.store;
  const supportedCurrencies =
    listSupportedCurrencies().filter(c => currencies.includes(c.id)) || [];

  const mandatoryAccounts = supportedCurrencies.map(createAccount);
  const additionalAccounts = Array.from(
    { length: Math.max(0, count - mandatoryAccounts.length) },
    () => {
      const currency = sample(supportedCurrencies);
      if (!currency) {
        throw new Error("No supported currency available for creating an account.");
      }
      return createAccount(currency);
    },
  );

  const fakeAccounts = [...mandatoryAccounts, ...additionalAccounts];

  const newAccountData = accountData?.concat(fakeAccounts);
  const e = initAccounts(newAccountData || []);
  store.dispatch(e);
}

export default function GenerateMockAccountsWithNfts() {
  const { t } = useTranslation();
  const featureFlagsProvider = useFeatureFlags();

  const disableSimpleHash = () =>
    featureFlagsProvider.overrideFeature("nftsFromSimplehash", { enabled: false });

  const nftAccounts = Math.floor(Math.random() * 2) + 3;

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
