/**
 * A mock access token starts with this prefix so the MSW handlers can tell a mock session from a
 * real one without inspecting any other state.
 */
export const MOCK_CARD_ACCESS_TOKEN_PREFIX = "at_mock_";

/** The session the devtool installs, before any renewal has rotated it. */
export const MOCK_CARD_ACCESS_TOKEN = `${MOCK_CARD_ACCESS_TOKEN_PREFIX}devtool`;
export const MOCK_CARD_REFRESH_TOKEN = "rt_mock_devtool";

/**
 * Returns `true` when the request carries a mock bearer token, meaning its calls should be
 * answered by the MSW handlers rather than passed through to the real provider.
 */
export function isMockCardRequest(request: Request): boolean {
  return (
    request.headers.get("authorization")?.startsWith(`Bearer ${MOCK_CARD_ACCESS_TOKEN_PREFIX}`) ??
    false
  );
}
