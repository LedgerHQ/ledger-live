import { z } from "zod";
import type { ConfigOptionId, ConfigSwitches } from "../types";

export const optionIdSchema = z.enum({ staging: "staging", prod: "prod" } satisfies {
  readonly [Id in ConfigOptionId]: Id;
});

const OPTION_IDS: ReadonlySet<string> = new Set(optionIdSchema.options);

/** Whether the switches declare the switch. */
export const isDeclaredSwitch = (switches: ConfigSwitches, switchId: string) =>
  Object.hasOwn(switches, switchId);

/** Whether the switches declare the switch, and the option is one of the option ids. */
export const isDeclaredOption = (switches: ConfigSwitches, switchId: string, optionId: string) =>
  isDeclaredSwitch(switches, switchId) && OPTION_IDS.has(optionId);
