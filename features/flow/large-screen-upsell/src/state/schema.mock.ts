import type { LargeScreenUpsellModalState } from "./types";

export function mockLargeScreenUpsellModalState(
  overrides?: Partial<LargeScreenUpsellModalState>,
): LargeScreenUpsellModalState {
  return {
    retriesModal: 0,
    lastSeenAt: null,
    session: "ready",
    ...overrides,
  };
}

export function mockSeenLargeScreenUpsellModalState(
  overrides?: Partial<LargeScreenUpsellModalState>,
): LargeScreenUpsellModalState {
  return mockLargeScreenUpsellModalState({
    retriesModal: 1,
    lastSeenAt: Date.parse("2026-07-01T12:00:00.000Z"),
    session: "dismissed",
    ...overrides,
  });
}
