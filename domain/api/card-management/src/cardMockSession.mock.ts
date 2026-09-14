export const MOCK_CARD_ACCESS_TOKEN_PREFIX = "at_mock_";
export const MOCK_CARD_ACCESS_TOKEN = `${MOCK_CARD_ACCESS_TOKEN_PREFIX}devtool`;
export const MOCK_CARD_REFRESH_TOKEN = "rt_mock_devtool";

export function isMockCardRequest(request: Request): boolean {
  return (
    request.headers.get("authorization")?.startsWith(`Bearer ${MOCK_CARD_ACCESS_TOKEN_PREFIX}`) ??
    false
  );
}
