import { useCallback, useMemo, useState } from "react";
import type { ConfigOptionId } from "@shared/app-config";
import type { AppConfigToolProps } from "../../types";
import type { AppConfigViewModel, SwitchFilter, SwitchRowState } from "./types";

export function useAppConfigViewModel({
  defaultOptionId,
  switches,
  onSelectOption,
  onResetSwitch,
  onReloadApp,
}: AppConfigToolProps): AppConfigViewModel {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SwitchFilter>("all");

  const rows = useMemo<readonly SwitchRowState[]>(
    () =>
      // Without the session there is no default, and no switch either.
      defaultOptionId === undefined
        ? []
        : switches.map(configSwitch => {
            // The next session resolves to the saved option, or to the default without one.
            const selectedOptionId = configSwitch.savedOptionId ?? defaultOptionId;
            return {
              ...configSwitch,
              selectedOptionId,
              selectedValues: configSwitch.options.find(({ id }) => id === selectedOptionId)
                ?.values,
              isPending: selectedOptionId !== configSwitch.currentOptionId,
              // Runs on, or will run on, another option than the default.
              isSwitched:
                selectedOptionId !== defaultOptionId ||
                configSwitch.currentOptionId !== defaultOptionId,
            };
          }),
    [defaultOptionId, switches],
  );

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter(
      row =>
        (filter === "all" || row.isSwitched) &&
        (!query ||
          [row.label, row.id, ...Object.keys(row.selectedValues ?? {})].some(text =>
            text.toLowerCase().includes(query),
          )),
    );
  }, [rows, search, filter]);

  const pendingCount = rows.filter(({ isPending }) => isPending).length;

  const select = useCallback(
    (switchId: string, optionId: ConfigOptionId) => {
      // Selecting the default removes the saved option, so the switch follows the default again.
      if (optionId === defaultOptionId) {
        onResetSwitch(switchId);
      } else {
        onSelectOption(switchId, optionId);
      }
    },
    [defaultOptionId, onSelectOption, onResetSwitch],
  );

  return {
    defaultOptionId,
    rows: visibleRows,
    switchCount: rows.length,
    pendingCount,
    search,
    setSearch,
    filter,
    setFilter,
    select,
    reload: onReloadApp,
  };
}
