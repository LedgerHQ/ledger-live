// TODO should drop this file!,

import { Unit } from "@domain/entity-currency-unit";

export type ConfirmationDefaults = {
  confirmationsNb:
    | {
        min: number;
        def: number;
        max: number;
      }
    | null
    | undefined;
};

export type UnitDefaults = {
  unit: Unit;
};
