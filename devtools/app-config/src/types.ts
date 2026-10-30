import type { ConfigOptionId, ConfigSelectionId, RejectedDevValue } from "@shared/app-config";

/** A value of a switch, or a fixed value, as the tool lists it. */
export interface ConfigValueState {
  readonly name: string;
  /** The value this session runs on. */
  readonly currentValue: unknown;
  /** The value the next session runs on. */
  readonly nextValue: unknown;
  /** The value the next session runs on without a dev value: the default option's, or the fixed one. */
  readonly baseValue: unknown;
  /** A dev value is saved for the next session. */
  readonly hasDevValue: boolean;
  /** The last dev value the host refused to save, and why. */
  readonly rejectedDevValue: RejectedDevValue | undefined;
}

/** A switch of the session, as the tool lists it. */
export interface ConfigSwitchState {
  readonly id: string;
  readonly label: string;
  /** What this session runs on, resolved at boot. */
  readonly currentSelectionId: ConfigSelectionId;
  /** What is saved for the next session, or `undefined` when it follows the default. */
  readonly savedSelectionId: ConfigSelectionId | undefined;
  readonly values: readonly ConfigValueState[];
}

/** A fixed value of the session, as the tool lists it. */
export interface ConfigFixedValueState extends ConfigValueState {
  /** This session runs on its dev value. */
  readonly isDevCurrent: boolean;
  /** Dev is saved for the next session. */
  readonly isDevSaved: boolean;
}

export interface AppConfigToolProps {
  /** What the tool lists, or `undefined` until the host has the session. */
  readonly session?: {
    /**
     * The option of every switch without a saved one. It depends on the build: only a staging
     * default offers Dev.
     */
    readonly defaultOptionId: ConfigOptionId;
    /** Each switch with its current and saved selection, and its values. */
    readonly switches: readonly ConfigSwitchState[];
    readonly fixedValues: readonly ConfigFixedValueState[];
  };
  /** Saves what a switch or a fixed value selects for the next session. Nothing reloads. */
  readonly onSelect: (id: string, selectionId: ConfigSelectionId) => void;
  /** Removes the saved selection of a switch or a fixed value: the next session follows the default. */
  readonly onResetSelection: (id: string) => void;
  /** Saves the dev value of a value unless it does not parse, and returns whether it did. Nothing reloads. */
  readonly onSetDevValue: (name: string, value: string) => boolean;
  /** Removes the dev value of a value: on Dev, the next session runs on its base value. */
  readonly onRemoveDevValue: (name: string) => void;
  /** Reloads the app, which then runs on the saved selections and dev values. */
  readonly onReloadApp: () => void;
}
