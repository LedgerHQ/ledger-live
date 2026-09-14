/**
 * A mock access token starts with this prefix so the MSW handlers can tell a mock session from a
 * real one without inspecting any other state.
 */
export const MOCK_CARD_ACCESS_TOKEN_PREFIX = "at_mock_";

/**
 * Returns `true` when the request carries a mock bearer token, meaning its calls should be
 * answered by the MSW handlers rather than passed through to the real provider.
 */
export function isMockCardRequest(request: Request): boolean {
  const auth = request.headers.get("Authorization") ?? "";
  return auth.startsWith(`Bearer ${MOCK_CARD_ACCESS_TOKEN_PREFIX}`);
}
