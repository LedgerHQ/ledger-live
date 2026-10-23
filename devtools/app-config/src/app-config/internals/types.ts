import type { ConfigOptionId } from "@shared/app-config";
import type { ConfigSwitchState } from "../../types";

/** Which switches the list shows: all of them, or the switched ones. */
export type SwitchFilter = "all" | "switched";

/** A switch as its row shows it. */
export interface SwitchRowState extends ConfigSwitchState {
  /** The option the next session runs on: the saved one, or the default without one. */
  readonly selectedOptionId: ConfigOptionId;
  /** The values of the selected option. */
  readonly selectedValues: ConfigSwitchState["options"][number]["values"] | undefined;
  /** The next session runs on another option than this one. */
  readonly isPending: boolean;
  /** Runs on, or will run on, another option than the default. */
  readonly isSwitched: boolean;
}

/** What the web and native views of the tool render, and the actions they call. */
export interface AppConfigViewModel {
  readonly defaultOptionId: ConfigOptionId | undefined;
  /** The rows the search and the filter keep. */
  readonly rows: readonly SwitchRowState[];
  /** Every switch, whatever the search and the filter. */
  readonly switchCount: number;
  /** The pending switches, whatever the search and the filter. */
  readonly pendingCount: number;
  readonly search: string;
  readonly setSearch: (search: string) => void;
  readonly filter: SwitchFilter;
  readonly setFilter: (filter: SwitchFilter) => void;
  /** Saves an option of a switch, or resets the switch when the option is the default. */
  readonly select: (switchId: string, optionId: ConfigOptionId) => void;
  /** Reloads the app on the saved options. */
  readonly reload: () => void;
}
