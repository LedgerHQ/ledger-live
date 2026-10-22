import { useCallback, useMemo, useState } from "react";
import {
  APP_CONFIG_OPTION_IDS,
  type ConfigOptionId,
  type ConfigSelectionId,
} from "@shared/app-config";
import type {
  AppConfigToolProps,
  ConfigFixedValueState,
  ConfigSwitchState,
  ConfigValueState,
} from "../../types";
import type {
  AppConfigViewModel,
  FixedChoice,
  FixedRowState,
  RowFilter,
  SwitchRowState,
} from "./types";

export function useAppConfigViewModel({
  session,
  onSelect,
  onResetSelection,
  onReloadApp,
}: AppConfigToolProps): AppConfigViewModel {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RowFilter>("all");

  const defaultOptionId = session?.defaultOptionId;

  // Without the session there is nothing to list.
  const switchRows = useMemo<readonly SwitchRowState[]>(
    () =>
      session?.switches.map(configSwitch => switchRowOf(configSwitch, session.defaultOptionId)) ??
      [],
    [session],
  );
  const fixedRows = useMemo<readonly FixedRowState[]>(
    () => session?.fixedValues.map(fixedRowOf) ?? [],
    [session],
  );

  const isVisible = useCallback(
    (row: { readonly isSwitched: boolean }, texts: readonly string[]) => {
      const query = search.trim().toLowerCase();
      return (
        (filter === "all" || row.isSwitched) &&
        (!query || texts.some(text => text.toLowerCase().includes(query)))
      );
    },
    [search, filter],
  );
  const visibleSwitchRows = useMemo(
    () =>
      switchRows.filter(row =>
        isVisible(row, [row.label, row.id, ...row.values.map(({ name }) => name)]),
      ),
    [switchRows, isVisible],
  );
  const visibleFixedRows = useMemo(
    () => fixedRows.filter(row => isVisible(row, [row.value.name])),
    [fixedRows, isVisible],
  );

  const pendingCount = [...switchRows, ...fixedRows].filter(({ isPending }) => isPending).length;

  const selectOption = useCallback(
    (switchId: string, selectionId: ConfigSelectionId) => {
      // Selecting the default removes the saved selection, so the switch follows the default again.
      if (selectionId === defaultOptionId) {
        onResetSelection(switchId);
      } else {
        onSelect(switchId, selectionId);
      }
    },
    [defaultOptionId, onSelect, onResetSelection],
  );

  return {
    defaultOptionId,
    switchRows: visibleSwitchRows,
    fixedRows: visibleFixedRows,
    rowCount: switchRows.length + fixedRows.length,
    pendingCount,
    search,
    setSearch,
    filter,
    setFilter,
    selectOption,
    reload: onReloadApp,
  };
}

function switchRowOf(configSwitch: ConfigSwitchState, defaultOptionId: ConfigOptionId) {
  const { id, label, values, currentSelectionId, savedSelectionId } = configSwitch;
  // The next session resolves to the saved selection, or to the default without one.
  const selectedChoice = savedSelectionId ?? defaultOptionId;
  return {
    id,
    label,
    values,
    choices: APP_CONFIG_OPTION_IDS,
    currentChoice: currentSelectionId,
    selectedChoice,
    isPending: selectedChoice !== currentSelectionId || values.some(hasNewValue),
    isSwitched: selectedChoice !== defaultOptionId || currentSelectionId !== defaultOptionId,
  } satisfies SwitchRowState;
}

function fixedRowOf(value: ConfigFixedValueState) {
  const currentChoice: FixedChoice = value.isDevCurrent ? "dev" : "fixed";
  const selectedChoice: FixedChoice = value.isDevSaved ? "dev" : "fixed";
  return {
    value,
    choices: [],
    currentChoice,
    selectedChoice,
    isPending: selectedChoice !== currentChoice || hasNewValue(value),
    isSwitched: value.isDevCurrent || value.isDevSaved,
  } satisfies FixedRowState;
}

function hasNewValue({ currentValue, nextValue }: ConfigValueState) {
  return currentValue !== nextValue;
}
