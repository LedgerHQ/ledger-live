import type { ComponentType } from "react";

export type FamilyAppEffect = {
  readonly family: string;
  readonly AppEffect: ComponentType;
};

export type FamilyAppEffectsViewModel = {
  /** The app-wide effects of the coin families the user holds an account of, sorted by family. */
  readonly effects: readonly FamilyAppEffect[];
};
