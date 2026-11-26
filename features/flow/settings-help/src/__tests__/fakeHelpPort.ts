import type { HelpPort } from "../ports";

export const FAKE_HELP_LINKS = {
  support: "https://support.example",
  academy: "https://academy.example",
  status: "https://status.example",
};

export function createFakeHelpPort(): HelpPort & {
  clearCache: jest.Mock;
  resetApp: jest.Mock;
  viewUserData: jest.Mock;
  troubleshootNetwork: jest.Mock;
  launchOnboarding: jest.Mock;
} {
  return {
    links: FAKE_HELP_LINKS,
    clearCache: jest.fn().mockResolvedValue(undefined),
    resetApp: jest.fn().mockResolvedValue(undefined),
    viewUserData: jest.fn(),
    troubleshootNetwork: jest.fn(),
    launchOnboarding: jest.fn(),
  };
}
