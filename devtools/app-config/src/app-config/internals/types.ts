import type { ConfigOptionId, ConfigSelectionId } from "@shared/app-config";
import type { ConfigFixedValueState, ConfigValueState } from "../../types";

/** Which rows the list shows: all of them, or the switched ones. */
export type RowFilter = "all" | "switched";

/** What a fixed value runs on: its dev value, or the value the build fixes. */
export type FixedChoice = "dev" | "fixed";

/** What a row's control shows. */
interface RowState<Choice extends string> {
  /** What its control offers, in display order. None when it cannot change. */
  readonly choices: readonly Choice[];
  /** What this session runs on. */
  readonly currentChoice: Choice;
  /** What the next session runs on. */
  readonly selectedChoice: Choice;
  /** The next session runs on its dev values, so they are text fields. */
  readonly isOnDev: boolean;
  /** The next session runs on another choice, or other values, than this one. */
  readonly isPending: boolean;
  /** Runs on, or will run on, another choice than the default. */
  readonly isSwitched: boolean;
}

/** A switch as its row shows it. */
export interface SwitchRowState extends RowState<ConfigSelectionId> {
  readonly id: string;
  readonly label: string;
  readonly values: readonly ConfigValueState[];
}

/** A fixed value as its row shows it. */
export interface FixedRowState extends RowState<FixedChoice> {
  readonly value: ConfigFixedValueState;
}

/** What the web and native views of the tool render, and the actions they call. */
export interface AppConfigViewModel {
  readonly defaultOptionId: ConfigOptionId | undefined;
  /** The switch rows the search and the filter keep. */
  readonly switchRows: readonly SwitchRowState[];
  /** The fixed value rows the search and the filter keep. */
  readonly fixedRows: readonly FixedRowState[];
  /** Every row, whatever the search and the filter. */
  readonly rowCount: number;
  /** The pending rows, whatever the search and the filter. */
  readonly pendingCount: number;
  readonly search: string;
  readonly setSearch: (search: string) => void;
  readonly filter: RowFilter;
  readonly setFilter: (filter: RowFilter) => void;
  /** Saves the unsaved drafts, then what a switch selects, or resets the switch to the default. */
  readonly selectOption: (switchId: string, selectionId: ConfigSelectionId) => void;
  /** Saves the unsaved drafts, then puts a fixed value on Dev or resets it to the fixed value. */
  readonly selectFixed: (name: string, choice: FixedChoice) => void;
  /** Saves a dev value, and returns whether the host took it. */
  readonly setDevValue: (name: string, value: string) => boolean;
  readonly removeDevValue: (name: string) => void;
  /**
   * Keeps `commit`, which saves an unsaved draft and returns whether the host took it, for the next
   * reload or selection change, until the returned function drops it.
   */
  readonly registerDraft: (commit: () => boolean) => () => void;
  /**
   * Saves every unsaved draft, then reloads the app on the saved selections and dev values, unless
   * the host refused a draft: the field then shows why.
   */
  readonly reload: () => void;
}
