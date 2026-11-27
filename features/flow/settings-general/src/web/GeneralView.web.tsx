import React from "react";
import { Coins, Globe, Language, Refresh, ThemeFill } from "@ledgerhq/lumen-ui-react/symbols";
import { SettingsRow, SettingsSection } from "@features/flow-settings";
import type { GeneralSectionViewModel } from "../useGeneralSectionViewModel";
import { RegionPicker } from "./RegionPicker";
import type { RegionPickerViewModel } from "./useRegionPickerViewModel";

type GeneralViewProps = GeneralSectionViewModel &
  Readonly<{ region: RegionPickerViewModel; testID?: string }>;

export function GeneralView({
  labels,
  ledgerSync,
  theme,
  language,
  region,
  currency,
  testID,
}: GeneralViewProps) {
  return (
    <>
      <SettingsSection testID={testID}>
        <SettingsRow
          title={labels.ledgerSync.title}
          description={labels.ledgerSync.description}
          icon={<Refresh size={24} />}
          trailing={{ type: "button", label: ledgerSync.actionLabel, onSelect: ledgerSync.onOpen }}
          testID="settings-general-ledgerSync"
        />
        <SettingsRow
          title={labels.theme.title}
          description={labels.theme.description}
          icon={<ThemeFill size={24} />}
          trailing={{
            type: "select",
            value: theme.value,
            options: theme.options,
            onSelectOption: theme.onSelect,
          }}
          testID="settings-general-theme"
        />
        <SettingsRow
          title={labels.language.title}
          description={labels.language.description}
          icon={<Language size={24} />}
          trailing={{
            type: "select",
            value: language.value,
            options: language.options,
            onSelectOption: language.onSelect,
            search: labels.search,
          }}
          testID="settings-general-language"
        />
        <SettingsRow
          title={region.labels.title}
          description={region.labels.description}
          icon={<Globe size={24} />}
          trailing={{ type: "picker", label: region.label, onSelect: region.onOpenPicker }}
          testID="settings-general-region"
        />
        <SettingsRow
          title={labels.currency.title}
          description={labels.currency.description}
          icon={<Coins size={24} />}
          trailing={{
            type: "select",
            value: currency.value,
            options: currency.options,
            onSelectOption: currency.onSelect,
            search: labels.search,
          }}
          testID="settings-general-currency"
        />
      </SettingsSection>
      <RegionPicker region={region} />
    </>
  );
}
