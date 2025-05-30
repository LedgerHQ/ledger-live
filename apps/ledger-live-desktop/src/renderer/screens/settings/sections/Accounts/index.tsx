import React from "react";
import { useTranslation } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import { SettingsSectionRow as Row, SettingsSectionBody as Body } from "../../SettingsSection";
import HideEmptyTokenAccountsToggle from "./HideEmptyTokenAccountsToggle";
import FilterTokenOperationsZeroAmount from "./FilterTokenOperationsZeroAmount";
import SectionExport from "./Export";
import Currencies from "./Currencies";
import BlacklistedTokens from "./BlacklistedTokens";
import HiddenNftCollections from "./HiddenNFTCollections";
import HiddenInscriptions from "./HiddenInscriptions";
import { FeatureToggle } from "@ledgerhq/live-common/featureFlags/index";
export default function SectionAccounts() {
  const { t } = useTranslation();

  return (
    <Body>
      <TrackPage category="Settings" name="Accounts" />
      <SectionExport />
      <Row
        title={t("settings.accounts.hideEmptyTokens.title")}
        desc={t("settings.accounts.hideEmptyTokens.desc")}
      >
        <HideEmptyTokenAccountsToggle />
      </Row>
      <FilterTokenOperationsZeroAmount />
      <BlacklistedTokens />
      <FeatureToggle featureId="llNftSupport">
        <HiddenNftCollections />
      </FeatureToggle>
      <FeatureToggle featureId="lldnewArchOrdinals">
        <HiddenInscriptions />
      </FeatureToggle>
      <Currencies />
    </Body>
  );
}
