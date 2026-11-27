import type { SettingsAboutPort } from "../ports";

export const FAKE_ABOUT_LINKS = {
  terms: "https://terms.example",
  x: "https://x.example",
  instagram: "https://instagram.example",
  github: "https://github.example",
};

export function createFakeSettingsAboutPort(): SettingsAboutPort & {
  unlockDeveloperTools: jest.Mock;
} {
  return {
    version: "1.2.3",
    links: FAKE_ABOUT_LINKS,
    unlockDeveloperTools: jest.fn(),
  };
}
