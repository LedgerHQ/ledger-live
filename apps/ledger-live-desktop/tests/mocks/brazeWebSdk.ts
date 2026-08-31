/**
 * Stub for @braze/web-sdk in Jest — the real package is ESM-only and cannot be parsed by Jest
 * without transform exceptions. Use with:
 * `jest.mock("@braze/web-sdk", () => require("tests/mocks/brazeWebSdk").getBrazeWebSdkJestMock());`
 */
export function getBrazeWebSdkJestMock(): Record<string, unknown> {
  class ClassicCard {}
  return {
    ClassicCard,
    getCachedContentCards: () => ({ cards: [] }),
    initialize: jest.fn(() => true),
    changeUser: jest.fn(),
    requestContentCardsRefresh: jest.fn(),
    subscribeToContentCardsUpdates: jest.fn(() => "subscription-id"),
    removeSubscription: jest.fn(),
    wipeData: jest.fn(),
    enableSDK: jest.fn(),
    automaticallyShowInAppMessages: jest.fn(),
    openSession: jest.fn(),
    logCardDismissal: jest.fn(),
    logContentCardClick: jest.fn(),
    logContentCardImpressions: jest.fn(),
  };
}
