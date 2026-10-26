import { z } from "zod";
import type { AppConfigDeclarations, ConfigOptionId, ConfigSelectionId } from "../types";

export const optionIdSchema = z.enum({ staging: "staging", prod: "prod" } satisfies {
  readonly [Id in ConfigOptionId]: Id;
});

export const selectionIdSchema = z.enum({ dev: "dev", ...optionIdSchema.enum } satisfies {
  readonly [Id in ConfigSelectionId]: Id;
});

const OPTION_IDS: ReadonlySet<string> = new Set(optionIdSchema.options);

/** Whether the switches declare this switch, or the fixed values this value. */
export const isSelectable = ({ switches, fixed }: AppConfigDeclarations, id: string) =>
  Object.hasOwn(switches, id) || Object.hasOwn(fixed, id);

/**
 * Whether `id` can select `selectionId`: a switch any of its options, and a switch or a fixed value
 * `dev` when the default is staging.
 */
export function isAllowedSelection(
  declarations: AppConfigDeclarations,
  id: string,
  selectionId: string,
): boolean {
  if (selectionId === "dev") {
    return declarations.default === "staging" && isSelectable(declarations, id);
  }
  return Object.hasOwn(declarations.switches, id) && OPTION_IDS.has(selectionId);
}

/** Whether `name` can hold a dev value: it is a fixed value or a value of the switches. */
export const acceptsDevValue = (
  { switches, fixed, default: defaultOptionId }: AppConfigDeclarations,
  name: string,
) =>
  Object.hasOwn(fixed, name) ||
  Object.values(switches).some(({ options }) => Object.hasOwn(options[defaultOptionId], name));
