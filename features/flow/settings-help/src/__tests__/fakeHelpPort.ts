import type { DesktopHelpPort, MobileHelpPort } from "../ports";

export const FAKE_HELP_LINKS = {
  support: "https://support.example",
  academy: "https://academy.example",
  status: "https://status.example",
};

export function createFakeHelpPort(): DesktopHelpPort & {
  clearCache: jest.Mock;
  resetApp: jest.Mock;
  viewUserData: jest.Mock;
  launchOnboarding: jest.Mock;
} {
  return {
    platform: "desktop",
    links: FAKE_HELP_LINKS,
    clearCache: jest.fn().mockResolvedValue(undefined),
    resetApp: jest.fn().mockResolvedValue(undefined),
    viewUserData: jest.fn(),
    launchOnboarding: jest.fn(),
  };
}

export function createFakeMobileHelpPort({
  supportOpensChatbot = false,
}: Readonly<{ supportOpensChatbot?: boolean }> = {}): MobileHelpPort & {
  clearCache: jest.Mock;
  saveLogs: jest.Mock;
} {
  return {
    platform: "mobile",
    links: FAKE_HELP_LINKS,
    supportOpensChatbot,
    clearCache: jest.fn().mockResolvedValue(undefined),
    saveLogs: jest.fn(),
  };
}
