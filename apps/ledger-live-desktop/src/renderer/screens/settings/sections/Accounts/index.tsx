import React from "react";
import { useTranslation } from "react-i18next";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import { SettingsSectionRow as Row, SettingsSectionBody as Body } from "../../SettingsSection";
import HideEmptyTokenAccountsToggle from "./HideEmptyTokenAccountsToggle";
import FilterTokenOperationsZeroAmount from "./FilterTokenOperationsZeroAmount";
import FilterTokenOperationsThreshold from "./FilterTokenOperationsThreshold";
import SectionExport from "./Export";
import Currencies from "./Currencies";
import BlacklistedTokens from "./BlacklistedTokens";
import DoNotAskAgainSkipMemo from "./DoNotAskAgainSkipMemo";

export default function SectionAccounts() {
  const { t } = useTranslation();
  const lldHideSmallValueTokenOperations = useFeature("lldHideSmallValueTokenOperations");

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
      {lldHideSmallValueTokenOperations?.enabled && <FilterTokenOperationsThreshold />}
      <DoNotAskAgainSkipMemo />
      <BlacklistedTokens />
      <Currencies />
    </Body>
  );
}
