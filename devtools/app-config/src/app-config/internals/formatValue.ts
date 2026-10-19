/** A config value as the tool displays it: strings as they are, anything else as JSON. */
export const formatValue = (value: unknown) =>
  typeof value === "string" ? value : JSON.stringify(value);
