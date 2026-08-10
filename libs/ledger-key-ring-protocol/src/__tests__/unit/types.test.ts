import { MemberCredentialsSchema } from "../../types";

describe("MemberCredentialsSchema", () => {
  const memberCredentials = {
    pubkey: "02e3311a12c450604725f02d1a775ef5cdb4a1b832eb41ac6b1302adbe92a612fc",
    privatekey: "873f500bd20783224f7e78d4f8cce3d2bf69eb8008fbd697d20bbea31a721a03",
  };

  it("should accept matching member credentials", () => {
    expect(MemberCredentialsSchema.safeParse(memberCredentials).success).toBe(true);
  });

  it.each([
    null,
    {},
    { ...memberCredentials, pubkey: "" },
    { ...memberCredentials, privatekey: "not-hex" },
    { ...memberCredentials, unexpected: "value" },
    { ...memberCredentials, pubkey: memberCredentials.pubkey.toUpperCase() },
    { ...memberCredentials, privatekey: memberCredentials.privatekey.toUpperCase() },
    { ...memberCredentials, privatekey: "01".repeat(32) },
  ])("should reject invalid member credentials", invalidCredentials => {
    expect(MemberCredentialsSchema.safeParse(invalidCredentials).success).toBe(false);
  });
});
