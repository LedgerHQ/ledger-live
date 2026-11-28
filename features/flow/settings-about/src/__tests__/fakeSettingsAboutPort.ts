import type { SettingsAboutPort } from "../ports";

export const FAKE_TERMS_URL = "https://terms.example";

/** The desktop port: no feedback action and no row tracking, so no feedback row. */
export function createFakeSettingsAboutPort(): SettingsAboutPort & {
  unlockDeveloperTools: jest.Mock;
} {
  return {
    version: "1.2.3",
    termsUrl: FAKE_TERMS_URL,
    unlockDeveloperTools: jest.fn(),
  };
}

export const FAKE_STORE_REVIEW_URL = "https://store.example/review";

/**
 * The mobile port: a feedback action, a store review URL and row tracking, so the feedback and
 * rate rows are shown.
 */
export function createFakeMobileSettingsAboutPort(): ReturnType<
  typeof createFakeSettingsAboutPort
> & {
  feedback: jest.Mock;
  onRowSelect: jest.Mock;
} {
  return {
    ...createFakeSettingsAboutPort(),
    feedback: jest.fn(),
    storeReview: { url: FAKE_STORE_REVIEW_URL, storeName: "App Store" },
    onRowSelect: jest.fn(),
  };
}
