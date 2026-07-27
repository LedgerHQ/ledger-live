import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Divider, Switch } from "@ledgerhq/lumen-ui-react";
import {
  FeatureFlagPreview,
  FeatureParamRow,
  MainFeatureToggle,
} from "../WalletFeaturesDevTool/components";
import { ContactsDevToolContentProps } from "./types";
import { useContactsDevToolViewModel } from "./hooks/useContactsDevToolViewModel";
import { CONTACTS_FLAG } from "./constants";
import { EligibleAddressFamiliesSection } from "./components/EligibleAddressFamiliesSection";

export const ContactsDevToolContent = ({ expanded }: ContactsDevToolContentProps) => {
  const { t } = useTranslation();
  const {
    featureFlag,
    isEnabled,
    params,
    customFamiliesInput,
    handleToggleEnabled,
    handleToggleNewBadge,
    handleSetEligibleAddressFamilies,
    setCustomFamiliesInput,
    handleApplyCustomFamilies,
    handleLoadPopulatedContacts,
    handleResetContacts,
    handleResetOverride,
    hasDismissedFeatureIntroduction,
    handleToggleFeatureIntroductionDismissed,
  } = useContactsDevToolViewModel();

  return (
    <div className="flex flex-col gap-2 pt-2">
      <p className="text-muted">{t("settings.developer.contactsDevTool.description")}</p>

      {expanded && (
        <div className="mt-4 flex flex-col gap-12">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              <span className="body-2-semi-bold text-muted">
                {t("settings.developer.contactsDevTool.mainFeatureToggle")}
              </span>
              <Divider />
              <MainFeatureToggle
                flagName={CONTACTS_FLAG}
                switchName="contacts-enabled"
                isEnabled={isEnabled}
                onToggle={handleToggleEnabled}
              />
            </div>

            <div className="flex flex-col gap-4">
              <span className="body-2-semi-bold text-muted">
                {t("settings.developer.contactsDevTool.featureParameters")}
              </span>
              <Divider />
              <div className="flex flex-col rounded-md bg-surface px-4 py-1">
                <FeatureParamRow
                  paramKey="newBadge"
                  switchName="contacts-newBadge"
                  label="New badge"
                  isEnabled={isEnabled}
                  isSelected={isEnabled && params.newBadge}
                  onToggle={handleToggleNewBadge}
                />
              </div>
              <EligibleAddressFamiliesSection
                isEnabled={isEnabled}
                families={params.eligibleAddressFamilies}
                customFamiliesInput={customFamiliesInput}
                onPresetSelect={handleSetEligibleAddressFamilies}
                onCustomFamiliesInputChange={setCustomFamiliesInput}
                onApplyCustomFamilies={handleApplyCustomFamilies}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <span className="body-2-semi-bold text-muted">
              {t("settings.developer.contactsDevTool.featureIntroduction.title")}
            </span>
            <Divider />
            <div className="flex flex-col rounded-md bg-surface px-4 py-1">
              <div className="flex items-center justify-between p-10">
                <div className="flex flex-col gap-1">
                  <span className="body-3">
                    {t("settings.developer.contactsDevTool.featureIntroduction.label")}
                  </span>
                  <span className="body-3 text-muted">
                    {hasDismissedFeatureIntroduction
                      ? t("settings.developer.contactsDevTool.featureIntroduction.dismissed")
                      : t("settings.developer.contactsDevTool.featureIntroduction.willShow")}
                  </span>
                </div>
                <Switch
                  name="contacts-feature-introduction-dismissed"
                  selected={!hasDismissedFeatureIntroduction}
                  onChange={handleToggleFeatureIntroductionDismissed}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <span className="body-2-semi-bold text-muted">
              {t("settings.developer.contactsDevTool.contactsData")}
            </span>
            <Divider />
            <div className="flex flex-wrap items-center gap-4 pt-8">
              <Button appearance="accent" size="sm" onClick={handleLoadPopulatedContacts}>
                {t("settings.developer.contactsDevTool.loadPopulatedContacts")}
              </Button>
              <Button appearance="transparent" size="sm" onClick={handleResetContacts}>
                {t("settings.developer.contactsDevTool.resetContacts")}
              </Button>
              <Button appearance="transparent" size="sm" onClick={handleResetOverride}>
                {t("settings.developer.contactsDevTool.resetOverride")}
              </Button>
              <FeatureFlagPreview featureFlag={featureFlag} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
