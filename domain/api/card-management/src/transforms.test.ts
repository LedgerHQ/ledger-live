import { transformPayCardSessionResponse } from "./transforms";

describe("transformPayCardSessionResponse", () => {
  it("maps the snake_case token response onto the canonical session", () => {
    expect(
      transformPayCardSessionResponse({
        access_token: "access-token",
        expires_in: 3600,
        refresh_token: "refresh-token",
      }),
    ).toEqual({
      accessToken: "access-token",
      expiresIn: 3600,
      refreshToken: "refresh-token",
    });
  });
});
