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
    initialize: () => true,
    changeUser: () => {},
    requestContentCardsRefresh: () => {},
    subscribeToContentCardsUpdates: () => () => {},
    automaticallyShowInAppMessages: () => {},
    openSession: () => {},
    logCardDismissal: () => {},
    logContentCardClick: () => {},
    logContentCardImpressions: () => {},
  };
}
