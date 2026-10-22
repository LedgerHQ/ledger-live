/** An option of a config switch fails the schema of that switch. */
export class InvalidConfigOptionError extends Error {
  override name = "InvalidConfigOptionError";
  readonly switchId: string;
  readonly optionId: string;
  constructor(switchId: string, optionId: string, cause: unknown) {
    super(`Option "${optionId}" of config switch "${switchId}" does not match the schema`, {
      cause,
    });
    this.switchId = switchId;
    this.optionId = optionId;
  }
}

/** Two switches, or a switch and the fixed values, declare the same value name. */
export class DuplicateConfigValueError extends Error {
  override name = "DuplicateConfigValueError";
  readonly valueName: string;
  constructor(valueName: string) {
    super(`Config value "${valueName}" is declared more than once in the schema`);
    this.valueName = valueName;
  }
}
