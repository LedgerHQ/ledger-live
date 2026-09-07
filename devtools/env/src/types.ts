export interface EnvVarEntry {
  readonly key: string;
  readonly value: string;
  readonly defaultValue: string;
  readonly desc: string;
  readonly isOverridden: boolean;
}

export interface EnvDevToolProps {
  readonly envVars: EnvVarEntry[];
  readonly onOverride: (key: string, rawValue: string) => void;
  readonly onReset: (key: string) => void;
}
