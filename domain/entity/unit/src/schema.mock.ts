import type { Unit } from "./schema";

/**
 * Returns a valid {@link Unit} fixture (BTC, magnitude 8).
 * Pass `overrides` to customise individual fields for a specific test.
 */
export function mockUnit(overrides?: Partial<Unit>): Unit {
  return {
    name: "Bitcoin",
    code: "BTC",
    magnitude: 8,
    ...overrides,
  };
}
