import { transformPayCardSessionResponse } from "./transforms";

describe("transformPayCardSessionResponse", () => {
  it("maps the snake_case token response onto the canonical session", () => {
    expect(
      transformPayCardSessionResponse({
        access_token: "access-token",
        expires_in: 3600,
        refresh_token: "refresh-token",
        refresh_token_expires_in: 2592000,
      }),
    ).toEqual({
      accessToken: "access-token",
      expiresIn: 3600,
      refreshToken: "refresh-token",
      refreshTokenExpiresIn: 2592000,
    });
  });
});
