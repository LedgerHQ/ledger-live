import type { HandlerContext } from "../types";

/**
 * Shared factory for HandlerContext in handler unit tests.
 * All fields are set to safe defaults; pass overrides to customise per-test.
 */
export function makeContext(overrides: Partial<HandlerContext> = {}): HandlerContext {
  return {
    dispatch: jest.fn(),
    config: undefined,
    hasCompletedOnboarding: true,
    liveAppProviderInitialized: true,
    manifests: [],
    shouldDisplayMarketBanner: false,
    shouldDisplayWallet40MainNav: false,
    ...overrides,
  };
}
