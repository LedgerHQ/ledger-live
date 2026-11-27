import type { SettingsAboutPort } from "../ports";

export const FAKE_TERMS_URL = "https://terms.example";

export function createFakeSettingsAboutPort(): SettingsAboutPort & {
  unlockDeveloperTools: jest.Mock;
} {
  return {
    version: "1.2.3",
    termsUrl: FAKE_TERMS_URL,
    unlockDeveloperTools: jest.fn(),
  };
}
