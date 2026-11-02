import { useCallback, useMemo, useRef, useState } from "react";
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

const DEV_SWITCH_CHOICES: readonly ConfigSelectionId[] = ["dev", ...APP_CONFIG_OPTION_IDS];
const FIXED_CHOICES: readonly FixedChoice[] = ["dev", "fixed"];

export function useAppConfigViewModel({
  session,
  onSelect,
  onResetSelection,
  onSetDevValue,
  onRemoveDevValue,
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
    () => session?.fixedValues.map(value => fixedRowOf(value, session.defaultOptionId)) ?? [],
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

  // The commits of the fields whose text is not saved yet. On mobile, Restart and the option
  // controls do not end the editing of the focused field, so they run them first.
  const drafts = useRef(new Set<() => boolean>());
  const registerDraft = useCallback((commit: () => boolean) => {
    drafts.current.add(commit);
    return () => {
      drafts.current.delete(commit);
    };
  }, []);
  /** Runs every draft commit, and returns whether the host took them all. */
  const commitDrafts = useCallback(() => {
    let isEverySaved = true;
    for (const commit of drafts.current) isEverySaved = commit() && isEverySaved;
    return isEverySaved;
  }, []);
  const reload = useCallback(() => {
    if (commitDrafts()) onReloadApp();
  }, [commitDrafts, onReloadApp]);

  const selectOption = useCallback(
    (switchId: string, selectionId: ConfigSelectionId) => {
      commitDrafts();
      // Selecting the default removes the saved selection, so the switch follows the default again.
      if (selectionId === defaultOptionId) {
        onResetSelection(switchId);
      } else {
        onSelect(switchId, selectionId);
      }
    },
    [commitDrafts, defaultOptionId, onSelect, onResetSelection],
  );

  const selectFixed = useCallback(
    (name: string, choice: FixedChoice) => {
      commitDrafts();
      if (choice === "fixed") {
        onResetSelection(name);
      } else {
        onSelect(name, "dev");
      }
    },
    [commitDrafts, onSelect, onResetSelection],
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
    selectFixed,
    setDevValue: onSetDevValue,
    removeDevValue: onRemoveDevValue,
    registerDraft,
    reload,
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
    // Only a build whose default is staging offers Dev.
    choices: defaultOptionId === "staging" ? DEV_SWITCH_CHOICES : APP_CONFIG_OPTION_IDS,
    currentChoice: currentSelectionId,
    selectedChoice,
    isOnDev: selectedChoice === "dev",
    isPending: selectedChoice !== currentSelectionId || values.some(hasNewValue),
    isSwitched: selectedChoice !== defaultOptionId || currentSelectionId !== defaultOptionId,
  } satisfies SwitchRowState;
}

function fixedRowOf(value: ConfigFixedValueState, defaultOptionId: ConfigOptionId) {
  const currentChoice: FixedChoice = value.isDevCurrent ? "dev" : "fixed";
  const selectedChoice: FixedChoice = value.isDevSaved ? "dev" : "fixed";
  return {
    value,
    choices: defaultOptionId === "staging" ? FIXED_CHOICES : [],
    currentChoice,
    selectedChoice,
    isOnDev: value.isDevSaved,
    isPending: selectedChoice !== currentChoice || hasNewValue(value),
    isSwitched: value.isDevCurrent || value.isDevSaved,
  } satisfies FixedRowState;
}

function hasNewValue({ currentValue, nextValue }: ConfigValueState) {
  return currentValue !== nextValue;
}
