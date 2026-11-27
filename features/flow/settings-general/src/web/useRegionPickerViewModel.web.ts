import { useCallback, useMemo, useState } from "react";
import type { SettingsRowSelectOption } from "@features/flow-settings";
import { useGeneralSectionLabels } from "../copy/useGeneralSectionLabels";
import { useRegionLabels, type RegionLabels } from "../copy/useRegionLabels";
import { getRegionChoices, getRegionLabel } from "../logic/region/regionChoices";
import { useGeneralSettingsPort, useRegionSettingsPort } from "../useGeneralSettingsPort";

export type RegionPickerViewModel = Readonly<{
  labels: RegionLabels &
    Readonly<{ search: Readonly<{ placeholder: string; emptyLabel: string }> }>;
  value: string;
  label: string;
  options: readonly SettingsRowSelectOption[];
  query: string;
  onQueryChange: (query: string) => void;
  isPickerOpen: boolean;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  onSelect: (value: string) => void;
}>;

/** The Region row and its dialog, on desktop: regions named in the app language, searchable. */
export function useRegionPickerViewModel(): RegionPickerViewModel {
  const regionLabels = useRegionLabels();
  const { search } = useGeneralSectionLabels();
  const { language } = useGeneralSettingsPort().values;
  const { values, setValue } = useRegionSettingsPort();
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const choices = useMemo(() => getRegionChoices(language), [language]);
  const options = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? choices.filter(choice => choice.label.toLowerCase().includes(needle)) : choices;
  }, [choices, query]);

  const onOpenPicker = useCallback(() => setPickerOpen(true), []);
  const onClosePicker = useCallback(() => {
    setPickerOpen(false);
    setQuery("");
  }, []);
  const onSelect = useCallback(
    (value: string) => {
      setValue({ key: "region", value });
      onClosePicker();
    },
    [setValue, onClosePicker],
  );

  const labels = useMemo(() => ({ ...regionLabels, search }), [regionLabels, search]);

  return {
    labels,
    value: values.region,
    label:
      choices.find(choice => choice.value === values.region)?.label ??
      getRegionLabel(values.region, language),
    options,
    query,
    onQueryChange: setQuery,
    isPickerOpen,
    onOpenPicker,
    onClosePicker,
    onSelect,
  };
}
