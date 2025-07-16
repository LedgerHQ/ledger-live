import { initAccounts } from "~/renderer/actions/accounts";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/FeatureFlagsContext";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import React from "react";
import Button from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";
import { setKey } from "~/renderer/storage";

async function deleteAccounts() {
  setKey("app", "accounts", []);
  const store = window.ledger.store;
  const e = initAccounts([]);
  store.dispatch(e);
}

export default function DeleteAccounts() {
  const { t } = useTranslation();
  const featureFlagsProvider = useFeatureFlags();

  const enableSimpleHash = () =>
    featureFlagsProvider.overrideFeature("nftsFromSimplehash", { enabled: true });

  return (
    <SettingsSectionRow
      title={t("settings.developer.debugNfts.generatorAndDestructor.deleteAcc")}
      desc={t("settings.developer.debugNfts.generatorAndDestructor.deleteAccDesc")}
    >
      <Button
        danger
        onClick={() => {
          enableSimpleHash();
          deleteAccounts();
        }}
      >
        {t("settings.developer.debugNfts.generatorAndDestructor.delete")}
      </Button>
    </SettingsSectionRow>
  );
}
