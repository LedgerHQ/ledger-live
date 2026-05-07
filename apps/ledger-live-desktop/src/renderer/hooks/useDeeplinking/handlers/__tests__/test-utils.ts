import { DeeplinkHandlerContext } from "../../types";

export const createMockContext = (
  overrides: Partial<DeeplinkHandlerContext> = {},
): DeeplinkHandlerContext => ({
  dispatch: jest.fn(),
  accounts: [],
  hasCompletedOnboarding: true,
  navigate: jest.fn(),
  openAddAccountFlow: jest.fn(),
  openAssetFlow: jest.fn(),
  openSendFlow: jest.fn(),
  postOnboardingDeeplinkHandler: jest.fn(),
  tryRedirectToPostOnboardingOrRecover: jest.fn(() => false),
  currentPathname: "/",
  currentSearch: "",
  currentLocationState: undefined,
  accountsPath: "/accounts",
  isProductTourEnabled: true,
  ...overrides,
});
