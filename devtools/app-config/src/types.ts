import type { ConfigOptionId } from "@shared/app-config";

/** A switch of the session, as the tool lists it. */
export interface ConfigSwitchState {
  readonly id: string;
  readonly label: string;
  readonly options: readonly {
    readonly id: ConfigOptionId;
    readonly values: Readonly<Record<string, unknown>>;
  }[];
  /** The option this session runs on, resolved at boot. */
  readonly currentOptionId: ConfigOptionId;
  /** The option saved for the next session, or `undefined` when it follows the default. */
  readonly savedOptionId: ConfigOptionId | undefined;
}

export interface AppConfigToolProps {
  /**
   * The option of every switch without a saved one. It depends on the build, and is `undefined`
   * until the host has the session, when there are no switches either.
   */
  readonly defaultOptionId: ConfigOptionId | undefined;
  /** Each switch with its options, its current and saved option. */
  readonly switches: readonly ConfigSwitchState[];
  /** Saves an option of a switch for the next session. Nothing reloads. */
  readonly onSelectOption: (switchId: string, optionId: ConfigOptionId) => void;
  /** Removes the saved option of a switch: the next session follows the default. Nothing reloads. */
  readonly onResetSwitch: (switchId: string) => void;
  /** Reloads the app, which then runs on the saved options. */
  readonly onReloadApp: () => void;
}
