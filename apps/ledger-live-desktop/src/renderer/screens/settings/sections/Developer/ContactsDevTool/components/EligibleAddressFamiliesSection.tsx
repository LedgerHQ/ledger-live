import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Tag, TextInput } from "@ledgerhq/lumen-ui-react";
import { ELIGIBLE_ADDRESS_FAMILIES_PRESETS } from "../constants";

type EligibleAddressFamiliesSectionProps = {
  readonly isEnabled: boolean;
  readonly families: readonly string[];
  readonly customFamiliesInput: string;
  readonly onPresetSelect: (families: readonly string[]) => void;
  readonly onCustomFamiliesInputChange: (value: string) => void;
  readonly onApplyCustomFamilies: () => void;
};

const areFamiliesEqual = (left: readonly string[], right: readonly string[]) => {
  if (left.length !== right.length) {
    return false;
  }

  const leftFamilies = new Set(left);
  return right.every(family => leftFamilies.has(family));
};

export const EligibleAddressFamiliesSection = ({
  isEnabled,
  families,
  customFamiliesInput,
  onPresetSelect,
  onCustomFamiliesInputChange,
  onApplyCustomFamilies,
}: EligibleAddressFamiliesSectionProps) => {
  const { t } = useTranslation();

  return (
    <div
      className={`flex flex-col gap-4 rounded-md bg-surface p-10 transition-opacity ${
        isEnabled ? "opacity-100" : "opacity-50"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="body-3">
          {t("settings.developer.contactsDevTool.eligibleAddressFamilies")}
        </span>
        <div className="flex flex-wrap gap-2">
          {families.map(family => (
            <Tag key={family} appearance="base" size="sm" label={family} />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        {ELIGIBLE_ADDRESS_FAMILIES_PRESETS.map(preset => (
          <Button
            key={preset.id}
            appearance={areFamiliesEqual(families, preset.families) ? "accent" : "base"}
            size="sm"
            onClick={() => onPresetSelect(preset.families)}
            disabled={!isEnabled}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <span className="body-3 text-muted">
          {t("settings.developer.contactsDevTool.customFamiliesHint")}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <TextInput
            aria-label={t("settings.developer.contactsDevTool.eligibleAddressFamilies")}
            value={customFamiliesInput}
            onChange={event => onCustomFamiliesInputChange(event.target.value)}
            placeholder={t("settings.developer.contactsDevTool.customFamiliesPlaceholder")}
            disabled={!isEnabled}
          />
          <Button
            appearance="base"
            size="sm"
            onClick={onApplyCustomFamilies}
            disabled={!isEnabled || customFamiliesInput.trim().length === 0}
          >
            {t("settings.developer.contactsDevTool.applyFamilies")}
          </Button>
        </div>
      </div>
    </div>
  );
};
