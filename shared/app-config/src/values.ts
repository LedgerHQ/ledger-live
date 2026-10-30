import type { AppConfigDeclarations, ConfigSelectionId } from "./types";

/**
 * Resolves every configuration value from the selections and dev values a session accepts, before
 * any parsing. A switch on Dev takes the values of the default option with its own dev values on
 * top, and a fixed value on Dev its dev value. Only a staging-default session accepts `dev`.
 */
export function resolveAppConfigValues(
  { switches, fixed, default: defaultOptionId }: AppConfigDeclarations,
  selections: Readonly<Record<string, ConfigSelectionId>>,
  devValues: Readonly<Record<string, string>>,
): Readonly<Record<string, unknown>> {
  const switchValues = Object.entries(switches).map(([switchId, { options }]) => {
    const selectionId = selections[switchId];
    if (selectionId !== "dev") return options[selectionId ?? defaultOptionId];
    const defaultValues = options[defaultOptionId];
    return { ...defaultValues, ...devValuesOf(Object.keys(defaultValues)) };
  });
  const fixedDevValues = devValuesOf(Object.keys(fixed).filter(name => selections[name] === "dev"));

  return Object.assign({}, ...switchValues, fixed, fixedDevValues);

  function devValuesOf(names: readonly string[]) {
    return Object.fromEntries(
      names.filter(name => Object.hasOwn(devValues, name)).map(name => [name, devValues[name]]),
    );
  }
}
