import { PayCardPreAuthSchema, PayCardSessionSchema, PayCardUserSchema } from "./schema";

describe("Pay Card schemas", () => {
  it("validates the pre-auth entity", () => {
    expect(
      PayCardPreAuthSchema.parse({
        loginUrl: "https://card.test/login",
      }),
    ).toEqual({
      loginUrl: "https://card.test/login",
    });
  });

  it("validates the session entity", () => {
    expect(
      PayCardSessionSchema.parse({
        appSessionToken: "cs_example-session-token",
        expiresAt: "2026-07-30T10:00:00Z",
      }),
    ).toEqual({
      appSessionToken: "cs_example-session-token",
      expiresAt: "2026-07-30T10:00:00Z",
    });
  });

  it("validates the staging user entity", () => {
    expect(
      PayCardUserSchema.parse({
        verificationState: "VERIFIED",
        cardStatus: "ACTIVE",
        cardFunded: true,
        addedToDigitalWallet: false,
        hasFirstTransaction: false,
      }),
    ).toEqual({
      verificationState: "VERIFIED",
      cardStatus: "ACTIVE",
      cardFunded: true,
      addedToDigitalWallet: false,
      hasFirstTransaction: false,
    });
  });
});
