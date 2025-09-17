// TODO should drop this file!,

import { Unit } from "@ledgerhq/types-cryptoassets";

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
