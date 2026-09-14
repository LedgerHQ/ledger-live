import {
  isMockCardRequest,
  MOCK_CARD_ACCESS_TOKEN,
  MOCK_CARD_ACCESS_TOKEN_PREFIX,
} from "./cardMockSession.mock";

function requestWithToken(token: string): Request {
  return new Request("https://card.test/v1/user", {
    headers: { authorization: `Bearer ${token}` },
  });
}

describe("isMockCardRequest", () => {
  it("recognizes the DevTool mock session", () => {
    expect(isMockCardRequest(requestWithToken(MOCK_CARD_ACCESS_TOKEN))).toBe(true);
  });

  it("recognizes a rotated mock session", () => {
    expect(isMockCardRequest(requestWithToken(`${MOCK_CARD_ACCESS_TOKEN_PREFIX}2`))).toBe(true);
  });

  it("does not recognize a real or malformed authorization header", () => {
    expect(isMockCardRequest(requestWithToken("real-token"))).toBe(false);
    expect(
      isMockCardRequest(
        new Request("https://card.test/v1/user", {
          headers: { authorization: `Basic ${MOCK_CARD_ACCESS_TOKEN}` },
        }),
      ),
    ).toBe(false);
  });
});
