/** One app-wide switch the host owns: the tool only renders it. */
export interface AppToggle {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly isOn: boolean;
  /** Why the toggle can't apply on this build; the switch stays locked while it is set. */
  readonly lockedReason: string | null;
  readonly onChange: (isOn: boolean) => void;
}

export interface AppTogglesToolProps {
  readonly toggles: readonly AppToggle[];
}
